from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time
import asyncio
import io
import csv
import json
from model import XLMRoBERTModel

app = FastAPI(title="Social Media & Abuse Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_model = XLMRoBERTModel()

# ── Models ───────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    text: str
    threshold: Optional[float] = 0.3  # sensitivity threshold

class AnalyzeResponse(BaseModel):
    risk_score: float
    labels: dict
    highlights: list
    processing_time_ms: float

class BulkAnalyzeRequest(BaseModel):
    texts: List[str]
    threshold: Optional[float] = 0.3

class BulkResult(BaseModel):
    index: int
    text: str
    risk_score: float
    labels: dict
    highlights: list
    is_toxic: bool

class BulkAnalyzeResponse(BaseModel):
    results: List[BulkResult]
    total: int
    toxic_count: int
    safe_count: int
    avg_risk_score: float
    processing_time_ms: float


# ── Single text analysis ─────────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(req: AnalyzeRequest):
    start_time = time.time()
    result = await ai_model.predict(req.text)
    processing_time_ms = (time.time() - start_time) * 1000
    return AnalyzeResponse(
        risk_score=result["risk_score"],
        labels=result["labels"],
        highlights=result["highlights"],
        processing_time_ms=processing_time_ms,
    )

# ── Bulk text analysis ───────────────────────────────────────────────────────

@app.post("/analyze-bulk", response_model=BulkAnalyzeResponse)
async def analyze_bulk(req: BulkAnalyzeRequest):
    start_time = time.time()

    # Run all in parallel (asyncio.gather)
    tasks = [ai_model.predict(t) for t in req.texts]
    raw_results = await asyncio.gather(*tasks)

    results = []
    for i, (text, res) in enumerate(zip(req.texts, raw_results)):
        is_toxic = res["risk_score"] > (req.threshold * 100)
        results.append(BulkResult(
            index=i,
            text=text[:200],        # truncate for response size
            risk_score=res["risk_score"],
            labels=res["labels"],
            highlights=res["highlights"],
            is_toxic=is_toxic,
        ))

    toxic_count = sum(1 for r in results if r.is_toxic)
    avg_risk = sum(r.risk_score for r in results) / len(results) if results else 0

    return BulkAnalyzeResponse(
        results=results,
        total=len(results),
        toxic_count=toxic_count,
        safe_count=len(results) - toxic_count,
        avg_risk_score=round(avg_risk, 2),
        processing_time_ms=round((time.time() - start_time) * 1000, 2),
    )

# ── File upload analysis ─────────────────────────────────────────────────────

@app.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...), threshold: float = 0.3):
    start_time = time.time()
    content = await file.read()

    texts: List[str] = []
    filename = file.filename or ""

    # ── TXT: one text per line ──
    if filename.endswith(".txt"):
        decoded = content.decode("utf-8", errors="ignore")
        texts = [l.strip() for l in decoded.splitlines() if l.strip()]

    # ── CSV: try to find text column ──
    elif filename.endswith(".csv"):
        decoded = content.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(decoded))
        text_col = None
        rows = list(reader)
        if rows:
            # Prefer column named: text, message, content, comment, tweet, post, body
            preferred = ["text", "message", "content", "comment", "tweet", "post", "body", "description"]
            headers = [h.lower() for h in rows[0].keys()]
            for pref in preferred:
                if pref in headers:
                    text_col = list(rows[0].keys())[[h.lower() for h in rows[0].keys()].index(pref)]
                    break
            if not text_col:
                text_col = list(rows[0].keys())[0]  # fallback: first column
            texts = [row.get(text_col, "").strip() for row in rows if row.get(text_col, "").strip()]

    # ── JSON: array of strings or objects with text field ──
    elif filename.endswith(".json"):
        data = json.loads(content.decode("utf-8", errors="ignore"))
        if isinstance(data, list):
            for item in data:
                if isinstance(item, str):
                    texts.append(item.strip())
                elif isinstance(item, dict):
                    for key in ["text", "message", "content", "comment", "body"]:
                        if key in item and isinstance(item[key], str):
                            texts.append(item[key].strip())
                            break
        elif isinstance(data, dict):
            for key in ["text", "message", "content", "texts", "messages"]:
                if key in data:
                    val = data[key]
                    if isinstance(val, str):
                        texts = [val]
                    elif isinstance(val, list):
                        texts = [str(v) for v in val if v]
                    break
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use .txt, .csv, or .json")

    if not texts:
        raise HTTPException(status_code=400, detail="No text content found in file")

    # Cap at 500 to prevent timeout
    texts = texts[:500]

    # Run bulk analysis
    tasks = [ai_model.predict(t) for t in texts]
    raw_results = await asyncio.gather(*tasks)

    results = []
    for i, (text, res) in enumerate(zip(texts, raw_results)):
        is_toxic = res["risk_score"] > (threshold * 100)
        results.append(BulkResult(
            index=i,
            text=text[:200],
            risk_score=res["risk_score"],
            labels=res["labels"],
            highlights=res["highlights"],
            is_toxic=is_toxic,
        ))

    toxic_count = sum(1 for r in results if r.is_toxic)
    avg_risk = sum(r.risk_score for r in results) / len(results) if results else 0

    return BulkAnalyzeResponse(
        results=results,
        total=len(results),
        toxic_count=toxic_count,
        safe_count=len(results) - toxic_count,
        avg_risk_score=round(avg_risk, 2),
        processing_time_ms=round((time.time() - start_time) * 1000, 2),
    )


# ── Health check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": "XLM-RoBERT",
        "endpoints": ["/analyze", "/analyze-bulk", "/analyze-file"],
    }
