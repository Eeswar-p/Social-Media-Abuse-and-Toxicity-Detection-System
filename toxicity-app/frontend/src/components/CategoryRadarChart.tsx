import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip
} from 'recharts';

interface CategoryRadarChartProps {
    labels: Record<string, number>;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const val = (payload[0].value as number);
        const color = val > 70 ? '#ef4444' : val > 30 ? '#f59e0b' : '#10b981';
        return (
            <div className="bg-[#141414] border border-[#2b2b2b] rounded-lg px-3 py-2 text-xs shadow-xl">
                <p className="text-slate-400">{payload[0].payload.label}</p>
                <p className="font-bold text-base" style={{ color }}>{val.toFixed(0)}%</p>
            </div>
        );
    }
    return null;
};

export function CategoryRadarChart({ labels }: CategoryRadarChartProps) {
    const data = Object.entries(labels).map(([label, val]) => ({
        label,
        value: Math.round(val * 100),
    }));

    const maxVal = Math.max(...data.map(d => d.value));
    const strokeColor = maxVal > 70 ? '#ef4444' : maxVal > 30 ? '#f59e0b' : '#3b82f6';

    return (
        <div className="bg-[#141414] rounded-2xl border border-[#1f1f1f] p-5 shadow-lg">
            <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-2">
                Category Radar
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#2b2b2b" />
                    <PolarAngleAxis
                        dataKey="label"
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Radar
                        name="Toxicity"
                        dataKey="value"
                        stroke={strokeColor}
                        fill={strokeColor}
                        fillOpacity={0.18}
                        strokeWidth={2}
                        dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
                        isAnimationActive={true}
                        animationDuration={600}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
