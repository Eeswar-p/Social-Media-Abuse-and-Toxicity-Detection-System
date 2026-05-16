import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertOctagon, Download, Loader2, Table } from 'lucide-react';

interface BulkResult {
    index: number;
    text: string;
    risk_score: number;
    labels: Record<string, number>;
    highlights: string[];
    is_toxic: boolean;
}

interface BulkResponse {
    results: BulkResult[];
    total: number;
    toxic_count: number;
    safe_count: number;
    avg_risk_score: number;
    processing_time_ms: number;
}

interface FileUploadProps {
    threshold: number;
}

const API_BASE = 'http://localhost:8000';

export function FileUpload({ threshold }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<BulkResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (f: File) => {
        setFile(f);
        setResult(null);
        setError(null);
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('file', f);
            const res = await fetch(`${API_BASE}/analyze-file?threshold=${threshold}`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Analysis failed');
            }
            const data: BulkResponse = await res.json();
            setResult(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsAnalyzing(false);
        }
    }, [threshold]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const exportResults = () => {
        if (!result) return;
        const csv = [
            'Index,Text,Risk Score,Toxic,Threat,Hate Speech,Insult,Obscenity,Sarcasm',
            ...result.results.map(r =>
                `${r.index},"${r.text.replace(/"/g, '""')}",${r.risk_score.toFixed(1)},${r.is_toxic},${(r.labels['Threat'] * 100).toFixed(0)},${(r.labels['Hate Speech'] * 100).toFixed(0)},${(r.labels['Insult'] * 100).toFixed(0)},${(r.labels['Obscenity'] * 100).toFixed(0)},${(r.labels['Sarcasm'] * 100).toFixed(0)}`
            )
        ].join('\n');
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
            download: `bulk_analysis_${Date.now()}.csv`
        });
        a.click();
    };

    const displayed = result ? (showAll ? result.results : result.results.slice(0, 8)) : [];

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">File Analysis</span>
                    <span className="text-[10px] text-slate-600 font-mono">.txt · .csv · .json</span>
                </div>
                {result && (
                    <button onClick={exportResults} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-white/[0.06] text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-all">
                        <Download className="w-3 h-3" /> Export
                    </button>
                )}
            </div>

            <div className="p-5">
                {/* Drop zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragging
                            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                            : 'border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.02]'
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".txt,.csv,.json"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                    />
                    <AnimatePresence mode="wait">
                        {isAnalyzing ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                <p className="text-sm text-slate-400 font-medium">Analyzing <span className="text-indigo-300">{file?.name}</span>…</p>
                                <p className="text-xs text-slate-600">Running parallel inference on all rows</p>
                            </motion.div>
                        ) : file && result ? (
                            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                                <p className="text-sm font-semibold text-slate-200">{file.name}</p>
                                <p className="text-xs text-slate-500">{result.total} rows analyzed · {result.processing_time_ms.toFixed(0)}ms</p>
                                <button
                                    onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-rose-400 transition-colors mt-1"
                                >
                                    <X className="w-3 h-3" /> Upload another file
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                    <FileText className="w-7 h-7 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-300">Drop file here or <span className="text-indigo-400">browse</span></p>
                                    <p className="text-xs text-slate-600 mt-1">Supports .txt (lines), .csv (text column), .json (array) · max 500 rows</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Error */}
                {error && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2.5 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                        <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}

                {/* Summary stats */}
                {result && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
                        {/* Stat row */}
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { label: 'Total', value: result.total, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
                                { label: 'Toxic', value: result.toxic_count, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
                                { label: 'Safe', value: result.safe_count, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                                { label: 'Avg Risk', value: `${result.avg_risk_score.toFixed(1)}%`, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                            ].map(({ label, value, color, bg }) => (
                                <div key={label} className={`${bg} border rounded-xl p-3 text-center`}>
                                    <div className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">{label}</div>
                                    <div className={`text-xl font-black font-mono ${color}`}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Results table */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Table className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Results</span>
                            </div>
                            <div className="space-y-1.5">
                                {displayed.map((r) => {
                                    const color = r.risk_score > 70 ? 'text-rose-400' : r.risk_score > 30 ? 'text-yellow-400' : 'text-emerald-400';
                                    const dot = r.risk_score > 70 ? 'bg-rose-400' : r.risk_score > 30 ? 'bg-yellow-400' : 'bg-emerald-400';
                                    const rowBg = r.is_toxic ? 'bg-rose-500/5 border-rose-500/10' : 'bg-white/[0.02] border-white/[0.04]';
                                    return (
                                        <div key={r.index} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${rowBg}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                                            <span className="text-xs text-slate-400 font-mono w-6 flex-shrink-0 text-right">{r.index}</span>
                                            <span className="text-xs text-slate-300 flex-1 truncate">{r.text}</span>
                                            {r.highlights.length > 0 && (
                                                <span className="text-[10px] text-rose-400/70 flex-shrink-0">{r.highlights.length} flags</span>
                                            )}
                                            <span className={`text-xs font-black font-mono flex-shrink-0 ${color}`}>{r.risk_score.toFixed(1)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {result.results.length > 8 && (
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="mt-3 w-full text-xs text-slate-600 hover:text-indigo-400 transition-colors py-2 border border-white/[0.04] rounded-lg hover:border-indigo-500/20"
                                >
                                    {showAll ? '▲ Show less' : `▼ Show all ${result.results.length} results`}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
