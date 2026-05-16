import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, AlertOctagon, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface StatsPanelProps {
    totalAnalyzed: number;
    toxicCount: number;
    avgLatency: number;
    avgRisk: number;
}

export function StatsPanel({ totalAnalyzed, toxicCount, avgLatency, avgRisk }: StatsPanelProps) {
    const safeCount = totalAnalyzed - toxicCount;
    const toxicRate = totalAnalyzed > 0 ? ((toxicCount / totalAnalyzed) * 100).toFixed(1) : '0.0';

    const stats = [
        { icon: BarChart2, label: 'Analyzed', value: totalAnalyzed.toString(), sub: 'total inputs', color: '#818cf8', border: 'rgba(99,102,241,.25)', bg: 'rgba(99,102,241,.06)' },
        { icon: AlertOctagon, label: 'Toxic', value: toxicCount.toString(), sub: `${toxicRate}% rate`, color: '#f43f5e', border: 'rgba(244,63,94,.25)', bg: 'rgba(244,63,94,.06)' },
        { icon: CheckCircle2, label: 'Clean', value: safeCount.toString(), sub: 'passed filter', color: '#10b981', border: 'rgba(16,185,129,.25)', bg: 'rgba(16,185,129,.06)' },
        { icon: Clock, label: 'Latency', value: `${avgLatency.toFixed(0)}ms`, sub: 'avg response', color: '#f59e0b', border: 'rgba(245,158,11,.25)', bg: 'rgba(245,158,11,.06)' },
        { icon: TrendingUp, label: 'Avg Risk', value: `${avgRisk.toFixed(1)}%`, sub: 'rolling average', color: '#a855f7', border: 'rgba(168,85,247,.25)', bg: 'rgba(168,85,247,.06)' },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {stats.map(({ icon: Icon, label, value, sub, color, border, bg }, idx) => (
                <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * .06 }}
                    className="relative rounded-xl p-4 overflow-hidden glass-card-hover"
                    style={{ background: bg, border: `1px solid ${border}` }}>
                    <div className="hud-corner-tl" style={{ '--tw-border-opacity': 1, borderColor: border } as any} />

                    <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <span className="text-[9px] font-mono tracking-widest text-slate-700 uppercase">{label}</span>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={value} initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .25 }}>
                            <div className="text-2xl font-black font-mono tabular-nums" style={{ color }}>{value}</div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">{sub}</div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
                </motion.div>
            ))}

            {/* Wide "safe rate" bar */}
            {totalAnalyzed > 0 && (
                <div className="col-span-2 glass-card rounded-xl p-3">
                    <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-2 tracking-widest">
                        <span>SAFE RATE</span>
                        <span>{((safeCount / totalAnalyzed) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-[#161624] rounded-full overflow-hidden">
                        <motion.div className="h-full bar-gradient-safe rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${(safeCount / totalAnalyzed) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }} />
                    </div>
                </div>
            )}
        </div>
    );
}
