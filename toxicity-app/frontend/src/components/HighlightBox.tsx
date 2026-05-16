import { motion } from 'framer-motion';
import type { AnalyzeMetadata } from '../types';

interface HighlightBoxProps {
    text: string;
    metadata: AnalyzeMetadata | null;
}

export function HighlightBox({ text, metadata }: HighlightBoxProps) {
    if (!text) {
        return (
            <div className="p-5 h-full flex items-center justify-center text-slate-700 text-sm italic gap-2">
                <span className="opacity-50">✦</span> Awaiting input to map attention…
            </div>
        );
    }

    if (!metadata || metadata.highlights.length === 0) {
        return <div className="p-5 text-slate-300 text-sm leading-relaxed">{text}</div>;
    }

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const highlightRegex = new RegExp(`(${metadata.highlights.map(escapeRegExp).join('|')})`, 'gi');
    const parts = text.split(highlightRegex);

    return (
        <div className="p-5 text-slate-300 text-sm leading-relaxed">
            {parts.map((part, i) => {
                const isHighlight = metadata.highlights.some(h => h.toLowerCase() === part.toLowerCase());
                if (isHighlight) {
                    return (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="relative inline-flex items-center cursor-help group mx-0.5"
                        >
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold text-sm transition-all duration-200 group-hover:bg-rose-500/25 group-hover:border-rose-500/50"
                                style={{ boxShadow: '0 0 8px rgba(244,63,94,0.2)' }}>
                                {part}
                            </span>
                            {/* Tooltip */}
                            <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#0a0a0f] border border-rose-500/30 text-rose-300 text-[10px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 font-semibold">
                                ⚠️ Toxic Entity
                            </span>
                        </motion.span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </div>
    );
}
