export interface AnalyzeMetadata {
    risk_score: number;
    labels: Record<string, number>;
    highlights: string[];
    processing_time_ms: number;
}
