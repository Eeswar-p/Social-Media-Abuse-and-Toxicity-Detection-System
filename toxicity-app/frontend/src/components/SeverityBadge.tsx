interface SeverityBadgeProps {
    labels: Record<string, number>;
    riskScore: number;
}

const categoryEmoji: Record<string, string> = {
    'Threat': '⚠️',
    'Hate Speech': '🚫',
    'Insult': '💢',
    'Obscenity': '🤬',
    'Sarcasm': '😏',
};

export function SeverityBadge({ labels, riskScore }: SeverityBadgeProps) {
    const sorted = Object.entries(labels).sort((a, b) => b[1] - a[1]);
    const topCategory = sorted[0];
    const topPct = Math.round((topCategory?.[1] ?? 0) * 100);

    if (riskScore < 10 || !topCategory) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                ✅ Content appears safe
            </div>
        );
    }

    const color = topPct > 75 ? 'text-red-400 bg-red-500/10 border-red-500/25'
        : topPct > 40 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25'
            : 'text-blue-400 bg-blue-500/10 border-blue-500/25';

    const pulseColor = topPct > 75 ? 'bg-red-400' : topPct > 40 ? 'bg-yellow-400' : 'bg-blue-400';

    return (
        <div className={`flex items-center justify-between gap-2 px-4 py-2 border rounded-xl text-sm font-semibold ${color}`}>
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${pulseColor} animate-pulse`} />
                <span>{categoryEmoji[topCategory[0]] ?? '⚡'} Top signal: <strong>{topCategory[0]}</strong></span>
            </div>
            <span className="font-mono font-bold">{topPct}%</span>
        </div>
    );
}
