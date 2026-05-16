import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface DataPoint {
    index: number;
    score: number;
}

interface ToxicityHistoryChartProps {
    history: DataPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const val = payload[0].value as number;
        const color = val > 70 ? '#ef4444' : val > 30 ? '#f59e0b' : '#10b981';
        return (
            <div className="bg-[#141414] border border-[#2b2b2b] rounded-lg px-3 py-2 text-xs shadow-xl">
                <p className="text-slate-400 mb-1">Risk Score</p>
                <p className="font-bold text-lg" style={{ color }}>{val.toFixed(1)}%</p>
            </div>
        );
    }
    return null;
};

export function ToxicityHistoryChart({ history }: ToxicityHistoryChartProps) {
    const latestScore = history.length > 0 ? history[history.length - 1].score : 0;
    const avgScore = history.length > 0 ? history.reduce((s, d) => s + d.score, 0) / history.length : 0;
    const maxScore = history.length > 0 ? Math.max(...history.map(d => d.score)) : 0;

    const gradientId = "riskGradient";

    return (
        <div className="bg-[#141414] rounded-2xl border border-[#1f1f1f] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm">
                    Risk Score History
                </h3>
                <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500">Avg: <span className="text-white font-bold">{avgScore.toFixed(1)}%</span></span>
                    <span className="text-slate-500">Peak: <span className="text-red-400 font-bold">{maxScore.toFixed(1)}%</span></span>
                </div>
            </div>

            {history.length < 2 ? (
                <div className="h-40 flex items-center justify-center text-slate-600 text-sm italic">
                    Analyzing… chart populates after 2+ entries
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={history} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={latestScore > 70 ? '#ef4444' : latestScore > 30 ? '#f59e0b' : '#10b981'} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={latestScore > 70 ? '#ef4444' : latestScore > 30 ? '#f59e0b' : '#10b981'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                        <XAxis dataKey="index" hide />
                        <YAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2b2b2b', strokeWidth: 1 }} />
                        <ReferenceLine y={70} stroke="#ef444440" strokeDasharray="4 4" />
                        <ReferenceLine y={30} stroke="#f59e0b40" strokeDasharray="4 4" />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke={latestScore > 70 ? '#ef4444' : latestScore > 30 ? '#f59e0b' : '#10b981'}
                            strokeWidth={2.5}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 5, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={400}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
