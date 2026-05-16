import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, Shield, Zap, MessageSquare, ChevronRight,
  BarChart2, Radio, Trash2, Download, Cpu, Copy, Check,
  Terminal, AlertTriangle, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { RiskMeter } from './components/RiskMeter';
import { ProbabilityBars } from './components/ProbabilityBars';
import { HighlightBox } from './components/HighlightBox';
import { LiveStream } from './components/LiveStream';
import { ToxicityHistoryChart } from './components/ToxicityHistoryChart';
import { CategoryRadarChart } from './components/CategoryRadarChart';
import { StatsPanel } from './components/StatsPanel';
import { SeverityBadge } from './components/SeverityBadge';
import { FileUpload } from './components/FileUpload';
import { SettingsPanel } from './components/SettingsPanel';
import type { AnalyzeMetadata } from './types';

// Auto-detect if running on GitHub Pages (no backend available)
const IS_GITHUB_PAGES = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
const API_URL = 'http://localhost:8000/analyze';

// ── Mock inference for demo/GitHub Pages mode ─────────────
const TOXIC_WORDS: Record<string, number> = {
  kill:9, murder:9, hate:8, threat:7, stupid:7, idiot:7, worthless:8,
  trash:8, garbage:7, die:8, destroy:7, attack:8, hurt:7, racist:9,
  moron:7, loser:6, waste:7, freak:6, ugly:5, dumb:6, shut:4,
};
async function mockInfer(text: string): Promise<{ risk_score:number; labels:Record<string,number>; highlights:string[]; processing_time_ms:number }> {
  await new Promise(r => setTimeout(r, 60 + Math.random() * 40));
  const words = text.toLowerCase().match(/\b\w+\b/g) ?? [];
  let maxScore = 0;
  const highlights: string[] = [];
  words.forEach(w => { if (TOXIC_WORDS[w]) { maxScore = Math.max(maxScore, TOXIC_WORDS[w]); highlights.push(w); } });
  const risk_score = Math.min(98, maxScore * 10 + (highlights.length > 1 ? 8 : 0));
  const t = risk_score / 100;
  return {
    risk_score,
    labels: { Threat: +(t*0.8).toFixed(3), 'Hate Speech': +(t*0.6).toFixed(3), Insult: +(t*0.9).toFixed(3), Obscenity: +(t*0.4).toFixed(3), Sarcasm: +((t*0.2)+0.03).toFixed(3) },
    highlights: [...new Set(highlights)],
    processing_time_ms: 60 + Math.random() * 40,
  };
}

interface HistoryPoint { index: number; score: number; }
interface SessionEntry { text: string; score: number; ts: string; }
type LeftTab = 'text' | 'file';
type RightTab = 'analysis' | 'charts' | 'stats' | 'settings';

/* ── Blinking clock ──────────────────────────────────────── */
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return (
    <span className="font-mono text-xs text-slate-600 tracking-widest tabular-nums">
      {t.toLocaleTimeString('en-GB')}
    </span>
  );
}

function App() {
  const [leftTab, setLeftTab] = useState<LeftTab>('text');
  const [text, setText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [metadata, setMetadata] = useState<AnalyzeMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [session, setSession] = useState<SessionEntry[]>([]);
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);
  const [toxicCount, setToxicCount] = useState(0);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [rightTab, setRightTab] = useState<RightTab>('analysis');
  const [threshold, setThreshold] = useState(0.3);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const historyIdx = useRef(0);

  const recordResult = useCallback((data: AnalyzeMetadata, inputText: string) => {
    setMetadata(data);
    historyIdx.current += 1;
    setHistory(prev => [...prev, { index: historyIdx.current, score: data.risk_score }].slice(-40));
    setTotalAnalyzed(n => n + 1);
    if (data.risk_score > threshold * 100) setToxicCount(n => n + 1);
    setLatencies(prev => [...prev, data.processing_time_ms].slice(-60));
    const ts = new Date().toLocaleTimeString('en-GB');
    setSession(prev => [{ text: inputText.slice(0, 60), score: data.risk_score, ts }, ...prev].slice(0, 30));
  }, [threshold]);

    const analyzeText = useCallback(async (inputStr: string) => {
        if (!inputStr.trim()) { setMetadata(null); return; }
        setIsAnalyzing(true);
        try {
            let data: AnalyzeMetadata;
            if (IS_GITHUB_PAGES) {
                data = await mockInfer(inputStr) as AnalyzeMetadata;
            } else {
                const ctrl = new AbortController();
                const tid  = setTimeout(() => ctrl.abort(), 5000);
                const res  = await fetch(API_URL, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ text: inputStr, threshold }),
                    signal:  ctrl.signal,
                });
                clearTimeout(tid);
                if (!res.ok) return;
                data = await res.json();
            }
            recordResult(data, inputStr);
        } catch (err) { console.error('API error', err); }
        finally { setIsAnalyzing(false); }
    }, [threshold, recordResult]);

  useEffect(() => {
    if (isSimulating || leftTab !== 'text') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const id = setTimeout(() => analyzeText(text), 380);
    debounceRef.current = id;
    return () => clearTimeout(id);
  }, [text, isSimulating, analyzeText, leftTab]);

  const handleStreamMessage = (msg: string) => { setText(msg); analyzeText(msg); };

  const copyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const exportSession = () => {
    const csv = ['Timestamp,Text,Risk Score', ...session.map(e => `"${e.ts}","${e.text.replace(/"/g, '""')}",${e.score.toFixed(1)}`)].join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `session_${Date.now()}.csv`
    });
    a.click();
  };

  const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const avgRisk = history.length > 0 ? history.reduce((a, b) => a + b.score, 0) / history.length : 0;
  const emptyLabels = { Threat: 0, 'Hate Speech': 0, Insult: 0, Obscenity: 0, Sarcasm: 0 };
  const riskScore = metadata?.risk_score ?? 0;
  const isToxic = riskScore > 70;
  const isSuspect = riskScore > 30 && !isToxic;

  const rightTabs: { id: RightTab; label: string; icon: any }[] = [
    { id: 'analysis', label: 'Analysis', icon: Shield },
    { id: 'charts', label: 'Charts', icon: BarChart2 },
    { id: 'stats', label: 'Stats', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Cpu },
  ];

  return (
    <div className="min-h-screen flex flex-col">

      {/* ══════════════════ TOP STATUS BAR ══════════════════ */}
      <div className="flex items-center justify-between px-6 py-1.5 bg-black/30 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-indigo-500 font-mono tracking-widest uppercase">Shield AI v2.0</span>
          <span className="text-slate-800">|</span>
          <span className="text-[10px] text-slate-700 font-mono">NLP-MULTI-LABEL-CLASSIFIER</span>
        </div>
        <Clock />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="relative w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 status-dot-ping" />
              <span className="relative block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-600 font-mono">SYS:ONLINE</span>
          </div>
          <span className="text-slate-800">|</span>
          <span className="text-[10px] text-slate-700 font-mono">PORT:8000</span>
        </div>
      </div>

      {/* ══════════════════ HEADER ══════════════════════════ */}
      <header className="glass-card mx-4 mt-3 mb-4 rounded-2xl px-5 py-4 relative overflow-hidden">
        {/* HUD corners */}
        <div className="hud-corner-tl" /><div className="hud-corner-tr" />
        <div className="hud-corner-bl" /><div className="hud-corner-br" />

        {/* Animated background stripe */}
        <div className="absolute inset-0 shimmer rounded-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          {/* Logo + title */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 animate-float">
                <Shield className="w-7 h-7 text-white" />
              </div>
              {/* spinning ring */}
              <div className="absolute -inset-1 rounded-2xl border border-indigo-500/25 animate-spin-slow pointer-events-none" style={{ borderStyle: 'dashed' }} />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#02020a] animate-pulse" />
            </div>

            <div>
              <h1 className="font-display text-xl font-black tracking-widest gradient-text animate-glow-text leading-tight uppercase">
                Social Media Abuse Detection
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-indigo-500" />
                <p className="text-[10px] text-slate-600 font-mono tracking-[.18em] uppercase">
                  Real-time AI Content Moderation · Multi-label NLP Engine
                </p>
                <span className="w-1 h-1 rounded-full bg-purple-500" />
              </div>
            </div>
          </div>

          {/* Status strip */}
          <div className="hidden md:flex items-center gap-2.5">
            <StatusPill color="emerald" icon={<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              label="System Online" />
            <StatusPill color="indigo" icon={<Zap className="w-3 h-3" />}
              label={metadata ? `${metadata.processing_time_ms.toFixed(0)}ms` : '—ms'} mono />
            <StatusPill color="purple" icon={<Database className="w-3 h-3" />}
              label={`${totalAnalyzed} analyzed`} mono />
            <StatusPill color="yellow" icon={<Terminal className="w-3 h-3" />}
              label={`thr:${Math.round(threshold * 100)}%`} mono />

            <AnimatePresence>
              {isToxic && (
                <motion.div key="alert" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-black text-rose-400 animate-pulse-glow-red font-mono tracking-widest">
                  <AlertTriangle className="w-3.5 h-3.5 animate-neon-flicker" /> ⚠ TOXIC DETECTED
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ══════════════════ MAIN GRID ═══════════════════════ */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 pb-5 max-w-[1700px] mx-auto w-full">

        {/* ═══ LEFT COLUMN ═══ */}
        <div className="lg:col-span-7 flex flex-col gap-4">

          {/* Input-mode tab bar */}
          <div className="glass-card rounded-xl p-1 flex gap-1 relative overflow-hidden">
            <div className="absolute inset-0 cyber-divider opacity-0" />
            {(['text', 'file'] as LeftTab[]).map((id) => {
              const labels = { text: 'Text Input', file: 'File Upload' };
              const icons = { text: '✏️', file: '📂' };
              return (
                <button key={id} onClick={() => setLeftTab(id)}
                  className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold rounded-lg tracking-widest uppercase transition-all duration-300 ${leftTab === id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 hover:text-slate-300 hover:bg-white/[0.03]'
                    }`}>
                  {leftTab === id && <motion.span layoutId="tab-indicator" className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600" style={{ zIndex: -1 }} />}
                  <span>{icons[id]}</span> {labels[id]}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {leftTab === 'text' && (
              <motion.div key="text" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .28 }} className="flex flex-col gap-4">

                {/* ── Main analysis input card ── */}
                <div className={`glass-card rounded-2xl overflow-hidden flex flex-col transition-all duration-500 relative ${isToxic ? 'glow-border-red animate-pulse-glow-red' :
                    isSuspect ? 'glow-border-yellow' : 'glow-border-indigo'
                  }`}>
                  {/* HUD decorations */}
                  <div className="hud-corner-tl" /><div className="hud-corner-tr" />

                  {/* Scan line (only when toxic) */}
                  {isToxic && <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/70 to-transparent animate-scan z-20 pointer-events-none" />}

                  {/* Ambient glow blob */}
                  <div className="absolute inset-0 pointer-events-none transition-all duration-1000"
                    style={{
                      background: isToxic ? 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(244,63,94,.08) 0%, transparent 70%)' :
                        'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,.05) 0%, transparent 70%)'
                    }} />

                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05] bg-black/20 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${isToxic ? 'bg-rose-500 animate-pulse' : isAnalyzing ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`} />
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Text Analyzer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AnimatePresence>
                        {isAnalyzing && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold tracking-widest font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping inline-block" /> PROCESSING
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <span className="text-[10px] text-slate-700 font-mono tabular-nums">{text.length}ch</span>
                      <button onClick={copyText} title="Copy"
                        className={`p-1.5 rounded-lg transition-all ${copied ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10'}`}>
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setText(''); setMetadata(null); }}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={text}
                    onChange={e => { if (!isSimulating) setText(e.target.value); }}
                    disabled={isSimulating}
                    placeholder="Type or paste a social media message to analyze for threats, hate speech, insults…"
                    className="bg-transparent resize-none outline-none text-base leading-relaxed text-slate-200 placeholder-slate-800 disabled:opacity-50 p-5 min-h-[140px] relative z-10 terminal-cursor"
                  />

                  {/* Severity badge strip */}
                  <div className="px-5 pb-3 relative z-10">
                    <SeverityBadge labels={metadata ? metadata.labels : emptyLabels} riskScore={riskScore} />
                  </div>

                  {/* Highlight panel */}
                  <div className="border-t border-white/[0.04] bg-black/25 min-h-[88px] relative z-10">
                    <div className="px-5 pt-2.5 pb-1 flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-slate-700" />
                      <span className="text-[9px] font-bold text-slate-700 uppercase tracking-[.18em]">Token Attention Map</span>
                    </div>
                    <HighlightBox text={text} metadata={metadata} />
                  </div>
                </div>

                {/* Live stream */}
                <LiveStream onNewMessage={handleStreamMessage} isActive={isSimulating} setIsActive={setIsSimulating} />
              </motion.div>
            )}

            {leftTab === 'file' && (
              <motion.div key="file" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .28 }}>
                <FileUpload threshold={threshold} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Session Log ── */}
          <AnimatePresence>
            {session.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] bg-black/15">
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Session Log</span>
                    <span className="text-[9px] bg-purple-500/15 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded-full font-mono">{session.length} entries</span>
                  </div>
                  <button onClick={exportSession}
                    className="flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-indigo-300 transition-colors px-2.5 py-1.5 rounded-lg border border-white/[0.05] hover:border-indigo-500/30 hover:bg-indigo-500/5 font-mono">
                    <Download className="w-3 h-3" /> EXPORT.CSV
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-white/[0.025]">
                  <AnimatePresence initial={false}>
                    {session.map((e, i) => {
                      const dot = e.score > 70 ? 'bg-rose-500' : e.score > 30 ? 'bg-yellow-400' : 'bg-emerald-400';
                      const clr = e.score > 70 ? '#f43f5e' : e.score > 30 ? '#f59e0b' : '#10b981';
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 px-5 py-2 hover:bg-white/[0.02] transition-colors group">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                          <span className="text-xs text-slate-400 flex-1 truncate font-mono text-[11px]">{e.text}{e.text.length >= 60 ? '…' : ''}</span>
                          <span className="font-mono font-black text-xs flex-shrink-0" style={{ color: clr }}>{e.score.toFixed(1)}%</span>
                          <span className="text-[9px] text-slate-700 font-mono flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">{e.ts}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* Right tab bar */}
          <div className="glass-card rounded-xl p-1 flex gap-1">
            {rightTabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setRightTab(id)}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all duration-300 ${rightTab === id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-600 hover:text-slate-300 hover:bg-white/[0.03]'
                  }`}>
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {rightTab === 'analysis' && (
              <motion.div key="analysis" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                <RiskMeter score={riskScore} />
                <ProbabilityBars labels={metadata ? metadata.labels : emptyLabels} />
                <ModelInfo avgLatency={avgLatency} threshold={threshold} />
              </motion.div>
            )}
            {rightTab === 'charts' && (
              <motion.div key="charts" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                <ToxicityHistoryChart history={history} />
                <CategoryRadarChart labels={metadata ? metadata.labels : emptyLabels} />
              </motion.div>
            )}
            {rightTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                <StatsPanel totalAnalyzed={totalAnalyzed} toxicCount={toxicCount} avgLatency={avgLatency} avgRisk={avgRisk} />
                <RiskDistribution history={history} />
                <LatencyStats latencies={latencies} avgLatency={avgLatency} />
              </motion.div>
            )}
            {rightTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                <SettingsPanel threshold={threshold} onThresholdChange={setThreshold} />
                <AboutCard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ── Inline sub-components ───────────────────────────────── */

function StatusPill({ color, icon, label, mono }: { color: string; icon: React.ReactNode; label: string; mono?: boolean }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    indigo: 'bg-indigo-500/10  border-indigo-500/25  text-indigo-300',
    purple: 'bg-purple-500/10  border-purple-500/25  text-purple-300',
    yellow: 'bg-yellow-500/10  border-yellow-500/25  text-yellow-300',
    rose: 'bg-rose-500/10    border-rose-500/25    text-rose-400',
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${colors[color]}`}>
      {icon}
      <span className={mono ? 'font-mono' : ''}>{label}</span>
    </div>
  );
}

function ModelInfo({ avgLatency, threshold }: { avgLatency: number; threshold: number }) {
  const rows = [
    ['Backbone', 'XLM-RoBERTa Base'],
    ['Attention', 'Token Multi-Head'],
    ['Inference', 'Async Heuristic'],
    ['Labels', '5-class Multi-label'],
    ['Latency', `~${avgLatency.toFixed(0)}ms avg`],
    ['Threshold', `${Math.round(threshold * 100)}% sensitivity`],
  ];
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="hud-corner-tl" /><div className="hud-corner-br" />
      <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Cpu className="w-3 h-3 text-indigo-400" /> Model Architecture
      </h4>
      <div className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between items-center text-xs py-1.5 border-b border-white/[0.03]">
            <span className="text-slate-600 font-mono">{k}</span>
            <span className="text-slate-300 font-semibold font-mono text-[11px]">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskDistribution({ history }: { history: Array<{ score: number }> }) {
  if (!history.length) return null;
  const buckets = [
    { label: 'Safe (0–30%)', cnt: history.filter(h => h.score <= 30).length, bar: 'bar-gradient-safe', clr: '#10b981' },
    { label: 'Suspect (30–70%)', cnt: history.filter(h => h.score > 30 && h.score <= 70).length, bar: 'bar-gradient-warn', clr: '#f59e0b' },
    { label: 'Toxic (>70%)', cnt: history.filter(h => h.score > 70).length, bar: 'bar-gradient-danger', clr: '#f43f5e' },
  ];
  return (
    <div className="glass-card rounded-2xl p-5">
      <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Risk Distribution</h4>
      <div className="space-y-4">
        {buckets.map(({ label, cnt, bar, clr }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500">{label}</span>
              <span className="font-mono font-black" style={{ color: clr }}>{cnt}<span className="text-slate-700"> / {history.length}</span></span>
            </div>
            <div className="h-1.5 bg-[#1a1a26] rounded-full overflow-hidden">
              <motion.div className={`h-full rounded-full ${bar}`} initial={{ width: 0 }}
                animate={{ width: `${(cnt / history.length) * 100}%` }} transition={{ duration: .9, ease: 'easeOut' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LatencyStats({ latencies, avgLatency }: { latencies: number[]; avgLatency: number }) {
  if (!latencies.length) return null;
  return (
    <div className="glass-card rounded-2xl p-5">
      <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Latency Stats</h4>
      <div className="grid grid-cols-3 gap-3">
        {[['Min', Math.min(...latencies).toFixed(0), '#10b981'], ['Avg', avgLatency.toFixed(0), '#f59e0b'], ['Max', Math.max(...latencies).toFixed(0), '#f43f5e']].map(([l, v, c]) => (
          <div key={l} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
            <div className="text-[9px] text-slate-700 uppercase tracking-widest mb-1.5 font-mono">{l}</div>
            <div className="text-xl font-black font-mono" style={{ color: c as string }}>{v}<span className="text-xs text-slate-700">ms</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutCard() {
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="hud-corner-tl" /><div className="hud-corner-br" />
      <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">About System</h4>
      <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
        A multi-label NLP pipeline detecting 5 toxicity categories in real-time with a 7-layer heuristic engine: keyword, proximity, phrase, sarcasm, negation, context & safe-word layers.
      </p>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {[['Version', '2.0.0'], ['Backend', 'FastAPI'], ['Frontend', 'React + Vite'], ['Engine', 'Heuristic NLP v2'], ['Endpoints', '3 API Routes'], ['Max Batch', '500 rows']].map(([k, v]) => (
          <div key={k} className="flex justify-between bg-white/[0.02] border border-white/[0.04] px-3 py-1.5 rounded-lg">
            <span className="text-slate-600 font-mono">{k}</span>
            <span className="text-slate-300 font-mono font-semibold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
