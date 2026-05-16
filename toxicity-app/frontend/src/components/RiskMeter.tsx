import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskMeterProps { score: number; }

export function RiskMeter({ score }: RiskMeterProps) {
    const isSafe = score <= 30;
    const isSuspicious = score > 30 && score <= 70;
    const isToxic = score > 70;

    const strokeColor = isToxic ? '#f43f5e' : isSuspicious ? '#f59e0b' : '#10b981';
    const glowColor = isToxic ? 'rgba(244,63,94,.5)' : isSuspicious ? 'rgba(245,158,11,.35)' : 'rgba(16,185,129,.3)';
    const bgClass = isToxic ? 'animate-pulse-glow-red' : isSafe ? 'animate-pulse-glow-green' : '';
    const textGlow = isToxic ? 'text-glow-red' : isSuspicious ? 'text-glow-yellow' : 'text-glow-green';
    const statusText = isToxic ? 'TOXIC' : isSuspicious ? 'SUSPICIOUS' : 'SAFE';
    const Icon = isToxic ? ShieldAlert : isSuspicious ? AlertTriangle : ShieldCheck;

    const radius = 66;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const dashoffset = circumference - (score / 100) * circumference;

    // 24 tick marks
    const ticks = Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const outer = 78;
        const inner = i % 6 === 0 ? 70 : i % 3 === 0 ? 73 : 75;
        return {
            x1: 82 + inner * Math.cos(rad), y1: 82 + inner * Math.sin(rad),
            x2: 82 + outer * Math.cos(rad), y2: 82 + outer * Math.sin(rad),
            major: i % 6 === 0, mid: i % 3 === 0,
        };
    });

    return (
        <div className={`glass-card rounded-2xl p-5 relative overflow-hidden ${bgClass}`}>
            {/* HUD corners */}
            <div className="hud-corner-tl" /><div className="hud-corner-tr" />
            <div className="hud-corner-bl" /><div className="hud-corner-br" />

            {/* Ambient radial bg */}
            <div className="absolute inset-0 pointer-events-none transition-all duration-1000 rounded-2xl"
                style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${isToxic ? 'rgba(244,63,94,.06)' : isSuspicious ? 'rgba(245,158,11,.04)' : 'rgba(16,185,129,.04)'} 0%, transparent 70%)` }} />

            {/* Scan line when toxic */}
            {isToxic && <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/80 to-transparent animate-scan pointer-events-none z-20" />}

            <div className="relative z-10">
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-600 font-mono">Risk Score</h3>
                    <AnimatePresence mode="wait">
                        <motion.div key={statusText}
                            initial={{ opacity: 0, scale: .8, x: 8 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: .8 }}
                            className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border font-mono ${isToxic ? 'text-rose-400   border-rose-500/40   bg-rose-500/12  animate-neon-flicker' :
                                    isSuspicious ? 'text-yellow-400 border-yellow-500/35 bg-yellow-500/10' :
                                        'text-emerald-400 border-emerald-500/35 bg-emerald-500/10'
                                }`}>
                            <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: strokeColor }} />
                            {statusText}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Gauge */}
                <div className="flex items-center justify-center my-1">
                    <div className="relative">
                        <svg width="164" height="164" className="-rotate-90">
                            {/* Track */}
                            <circle cx="82" cy="82" r={radius} stroke="#161624" strokeWidth={strokeWidth} fill="none" />

                            {/* Blurred glow arc */}
                            <motion.circle cx="82" cy="82" r={radius}
                                stroke={strokeColor} strokeWidth={strokeWidth + 6} fill="none"
                                strokeLinecap="round" strokeOpacity={.18}
                                style={{ strokeDasharray: circumference, filter: 'blur(8px)' }}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: dashoffset }}
                                transition={{ duration: 1.3, ease: 'easeOut' }} />

                            {/* Main arc */}
                            <motion.circle cx="82" cy="82" r={radius}
                                stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
                                strokeLinecap="round"
                                style={{ strokeDasharray: circumference }}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: dashoffset }}
                                transition={{ duration: 1.3, ease: 'easeOut' }} />

                            {/* Tick marks */}
                            {ticks.map((t, i) => (
                                <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                                    stroke={t.major ? '#2a2a40' : t.mid ? '#1f1f30' : '#161624'}
                                    strokeWidth={t.major ? 2 : 1} />
                            ))}
                        </svg>

                        {/* Center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.div key={Math.round(score)} initial={{ scale: .75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .4 }}
                                className="flex flex-col items-center">
                                <Icon className={`w-6 h-6 mb-0.5 ${textGlow}`} style={{ color: strokeColor }} />
                                <span className={`text-[2.6rem] font-black tracking-tight font-mono leading-none ${textGlow}`} style={{ color: strokeColor }}>
                                    {Math.round(score)}
                                </span>
                                <span className="text-[10px] text-slate-700 font-mono mt-0.5">/ 100</span>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Score bar */}
                <div className="mt-4 space-y-1.5">
                    <div className="h-2 bg-[#161624] rounded-full overflow-hidden relative">
                        {/* Glow layer */}
                        <motion.div className="absolute inset-y-0 left-0 rounded-full opacity-50 blur-sm"
                            style={{ background: `linear-gradient(90deg, #059669, #f59e0b 50%, #f43f5e)` }}
                            initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.1, ease: 'easeOut' }} />
                        {/* Main bar */}
                        <motion.div className="absolute inset-y-0 left-0 rounded-full"
                            style={{ background: `linear-gradient(90deg, #10b981, #f59e0b 50%, #f43f5e)` }}
                            initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.1, ease: 'easeOut' }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-700 font-mono tracking-widest">
                        <span>▼ SAFE</span><span>RISK</span><span>TOXIC ▲</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
