import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Loader2, AlertOctagon, ArrowRight, ExternalLink, FileText, CheckCircle, Info } from 'lucide-react';
import type { AnalyzeMetadata } from '../types';

interface URLAnalyzerProps {
    onResult: (url: string, metadata: AnalyzeMetadata) => void;
    threshold: number;
}

const API_BASE = 'http://localhost:8000';

const EXAMPLE_URLS = [
    { label: 'Wikipedia (hate speech)', url: 'https://en.wikipedia.org/wiki/Hate_speech' },
    { label: 'Python Docs', url: 'https://docs.python.org/3/library/re.html' },
    { label: 'GitHub', url: 'https://github.com/trending' },
];

interface URLResult {
    page_title: string;
    char_count: number;
    fetch_status: number;
}

export function URLAnalyzer({ onResult, threshold }: URLAnalyzerProps) {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [urlResult, setUrlResult] = useState<URLResult | null>(null);

    const analyze = async (targetUrl?: string) => {
        const u = (targetUrl ?? url).trim();
        if (!u) return;

        // Auto-prepend https:// if missing
        const fullUrl = u.startsWith('http://') || u.startsWith('https://') ? u : `https://${u}`;

        setIsLoading(true);
        setError(null);
        setUrlResult(null);

        try {
            const res = await fetch(`${API_BASE}/analyze-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: fullUrl, threshold }),
            });

            const data = await res.json();

            if (!res.ok) {
                // data.detail is the human-readable error from FastAPI
                throw new Error(data.detail || `Server error ${res.status}`);
            }

            setUrlResult({
                page_title: data.page_title || '',
                char_count: data.char_count || 0,
                fetch_status: data.fetch_status || 200,
            });

            // Pass result up to App
            onResult(fullUrl, {
                risk_score: data.risk_score,
                labels: data.labels,
                highlights: data.highlights,
                processing_time_ms: data.processing_time_ms,
            });

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">URL Analyzer</span>
                    <span className="text-[10px] text-slate-600 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/[0.05]">Fetch & Scan Web Content</span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Input row */}
                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 focus-within:border-cyan-500/40 transition-colors">
                        <Globe className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        <input
                            type="url"
                            value={url}
                            onChange={e => { setUrl(e.target.value); setError(null); }}
                            onKeyDown={e => e.key === 'Enter' && analyze()}
                            placeholder="https://example.com/article…"
                            className="flex-1 bg-transparent outline-none text-sm text-slate-200 placeholder-slate-700 font-mono"
                        />
                        {url && (
                            <button onClick={() => { setUrl(''); setUrlResult(null); setError(null); }} className="text-slate-700 hover:text-slate-400 transition-colors text-xs">✕</button>
                        )}
                    </div>
                    <button
                        onClick={() => analyze()}
                        disabled={isLoading || !url.trim()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 whitespace-nowrap"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        {isLoading ? 'Scanning…' : 'Scan'}
                    </button>
                </div>

                {/* Example URLs */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-700 uppercase tracking-wide font-bold">Try:</span>
                    {EXAMPLE_URLS.map(({ label, url: u }) => (
                        <button
                            key={u}
                            onClick={() => { setUrl(u); analyze(u); }}
                            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-cyan-400 transition-colors px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-cyan-500/20"
                        >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-500/5 border border-indigo-500/15 rounded-xl">
                    <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 leading-snug">
                        Works best on static pages (Wikipedia, GitHub, docs, news articles).
                        Sites with <strong className="text-slate-400">Cloudflare/JavaScript protection</strong> (Twitter, Reddit, BBC) may block server-side fetching.
                    </p>
                </div>

                {/* Loading state */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-3 px-4 py-3.5 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-cyan-300">Fetching & analyzing page…</p>
                                <p className="text-[10px] text-slate-600 mt-0.5">Stripping HTML · Extracting text · Running inference</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-start gap-2.5 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                            <AlertOctagon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold mb-0.5">Failed to analyze URL</p>
                                <p className="text-rose-300/70">{error}</p>
                                {error.includes('bot') || error.includes('Cloudflare') || error.includes('JavaScript') ? (
                                    <p className="mt-1.5 text-yellow-500/80">
                                        💡 Try a Wikipedia or documentation URL instead — they work reliably.
                                    </p>
                                ) : null}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success result card */}
                <AnimatePresence>
                    {urlResult && !isLoading && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-3 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                {urlResult.page_title && (
                                    <p className="text-xs font-semibold text-slate-200 truncate">{urlResult.page_title}</p>
                                )}
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="flex items-center gap-1 text-[10px] text-slate-600">
                                        <FileText className="w-2.5 h-2.5" />
                                        {urlResult.char_count.toLocaleString()} chars extracted
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-500">HTTP {urlResult.fetch_status}</span>
                                </div>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">✓ Analyzed</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
