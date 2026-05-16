import { motion } from 'framer-motion';

interface ProbabilityBarsProps { labels: Record<string, number>; }

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string; bar: string; glow: string }> = {
    'Threat': { icon: '⚠️', color: '#f43f5e', bg: 'rgba(244,63,94,.08)', border: 'rgba(244,63,94,.2)', bar: 'bar-gradient-danger', glow: 'rgba(244,63,94,.35)' },
    'Hate Speech': { icon: '🚫', color: '#f97316', bg: 'rgba(249,115,22,.08)', border: 'rgba(249,115,22,.2)', bar: 'bar-gradient-danger', glow: 'rgba(249,115,22,.35)' },
    'Insult': { icon: '💢', color: '#f59e0b', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)', bar: 'bar-gradient-warn', glow: 'rgba(245,158,11,.3)' },
    'Obscenity': { icon: '🤬', color: '#a855f7', bg: 'rgba(168,85,247,.08)', border: 'rgba(168,85,247,.2)', bar: 'bar-gradient-default', glow: 'rgba(168,85,247,.3)' },
    'Sarcasm': { icon: '😏', color: '#06b6d4', bg: 'rgba(6,182,212,.08)', border: 'rgba(6,182,212,.2)', bar: 'bar-gradient-default', glow: 'rgba(6,182,212,.3)' },
};

export function ProbabilityBars({ labels }: ProbabilityBarsProps) {
    const sorted = Object.entries(labels).sort((a, b) => b[1] - a[1]);

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="hud-corner-tl" /><div className="hud-corner-br" />

            <div className="flex items-center justify-between mb-5">
                <h3 className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-600 font-mono">Classification Matrix</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    <span className="text-[9px] text-slate-700 font-mono tracking-widest">5 LABELS</span>
                </div>
            </div>

            <div className="space-y-3.5">
                {sorted.map(([label, probability], idx) => {
                    const pct = Math.round(probability * 100);
                    const cfg = CATEGORY_CONFIG[label] ?? { icon: '🔵', color: '#6366f1', bg: 'rgba(99,102,241,.08)', border: 'rgba(99,102,241,.2)', bar: 'bar-gradient-default', glow: 'rgba(99,102,241,.3)' };
                    const isDanger = pct > 65;
                    const isWarn = pct > 35 && !isDanger;
                    const isActive = pct > 8;

                    return (
                        <motion.div key={label}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.07, duration: .3 }}>

                            {/* Label row */}
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm leading-none">{cfg.icon}</span>
                                    <span className={`text-xs font-bold font-mono ${isActive ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
                                    {isDanger && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="text-[9px] font-black px-1.5 py-0.5 rounded font-mono tracking-widest animate-neon-flicker"
                                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                                            HIGH
                                        </motion.span>
                                    )}
                                    {isWarn && (
                                        <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 border border-yellow-500/25 px-1.5 py-0.5 rounded font-mono tracking-widest">
                                            MED
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-black font-mono tabular-nums"
                                    style={{ color: isActive ? cfg.color : '#2a2a40' }}>
                                    {pct}<span className="text-[9px] text-slate-700">%</span>
                                </span>
                            </div>

                            {/* Bar track */}
                            <div className="h-2 bg-[#161624] rounded-full overflow-hidden relative">
                                {/* Glow layer */}
                                {isDanger && (
                                    <motion.div className={`absolute inset-y-0 left-0 rounded-full ${cfg.bar} opacity-40 blur-sm`}
                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                        transition={{ duration: .9, ease: 'easeOut', delay: idx * .05 }} />
                                )}
                                {/* Main bar */}
                                <motion.div className={`absolute inset-y-0 left-0 rounded-full ${isActive ? cfg.bar : 'bg-[#1f1f30]'}`}
                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                    transition={{ duration: .9, ease: 'easeOut', delay: idx * .05 }} />
                            </div>

                            {/* Sub-label */}
                            <div className="flex justify-between mt-1">
                                <span className="text-[9px] text-slate-800 font-mono tracking-widest">
                                    {isDanger ? '▲ FLAGGED' : isWarn ? '◆ ELEVATED' : isActive ? '· DETECTED' : ''}
                                </span>
                                <span className="text-[9px] text-slate-800 font-mono">{(probability).toFixed(3)}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
