import { useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Info } from 'lucide-react';

interface SettingsPanelProps {
    threshold: number;
    onThresholdChange: (value: number) => void;
}

export function SettingsPanel({ threshold, onThresholdChange }: SettingsPanelProps) {
    const [showInfo, setShowInfo] = useState(false);

    const pct = Math.round(threshold * 100);
    const color = pct > 60 ? '#10b981' : pct > 35 ? '#f59e0b' : '#f43f5e';
    const label = pct > 60 ? 'Strict (low sensitivity)' : pct > 35 ? 'Balanced' : 'Sensitive (high sensitivity)';

    return (
        <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Detection Sensitivity</h4>
                </div>
                <button onClick={() => setShowInfo(!showInfo)} className="text-slate-600 hover:text-slate-400 transition-colors">
                    <Info className="w-3.5 h-3.5" />
                </button>
            </div>

            {showInfo && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-4 text-[11px] text-slate-500 bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 leading-relaxed">
                    The threshold controls how sensitive the detection is. <strong className="text-slate-300">Lower threshold</strong> = flags more content (more sensitive). <strong className="text-slate-300">Higher threshold</strong> = only flags clearly toxic content (more strict). Affects file/URL bulk analysis flagging.
                </motion.div>
            )}

            {/* Slider */}
            <div className="space-y-3">
                <div className="relative">
                    <input
                        type="range"
                        min={0.1}
                        max={0.9}
                        step={0.05}
                        value={threshold}
                        onChange={e => onThresholdChange(parseFloat(e.target.value))}
                        className="w-full h-2 rounded-full cursor-pointer appearance-none"
                        style={{
                            background: `linear-gradient(to right, ${color} 0%, ${color} ${((threshold - 0.1) / 0.8) * 100}%, #1a1a26 ${((threshold - 0.1) / 0.8) * 100}%, #1a1a26 100%)`
                        }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-mono font-black" style={{ color }}>{pct}%</span>
                        <span className="text-xs text-slate-600 ml-2">{label}</span>
                    </div>
                    <button
                        onClick={() => onThresholdChange(0.3)}
                        className="text-[10px] text-slate-600 hover:text-indigo-400 transition-colors"
                    >
                        Reset
                    </button>
                </div>

                {/* Preset buttons */}
                <div className="flex gap-2">
                    {[
                        { label: 'High', value: 0.15, color: 'text-rose-400 border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20' },
                        { label: 'Balanced', value: 0.30, color: 'text-yellow-400 border-yellow-500/25 bg-yellow-500/10 hover:bg-yellow-500/20' },
                        { label: 'Strict', value: 0.65, color: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20' },
                    ].map(({ label, value, color: btnColor }) => (
                        <button
                            key={label}
                            onClick={() => onThresholdChange(value)}
                            className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${btnColor} ${Math.abs(threshold - value) < 0.03 ? 'ring-1 ring-white/20' : ''}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
