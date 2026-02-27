// Wind types for the Smart Wind Calculator

export type WindType = "STRONG" | "TURBULENT" | "GUSTY" | "CALM";

export interface WindRecord {
    date: string; // ISO date string (YYYY-MM-DD)
    wind: WindType;
}

export type StructureType = "EASY_RISE" | "EASY_FALL" | "BOUNDARY";

export type GateLight = "GREEN" | "YELLOW" | "RED";

// Display labels for UI
export const WIND_LABELS: Record<WindType, { zh: string; en: string }> = {
    STRONG: { zh: "強風", en: "Strong" },
    TURBULENT: { zh: "亂流", en: "Turbulent" },
    GUSTY: { zh: "陣風", en: "Gusty" },
    CALM: { zh: "無風", en: "Calm" },
};

export const STRUCTURE_LABELS: Record<StructureType, { zh: string; en: string }> = {
    EASY_RISE: { zh: "易漲", en: "Easy Rise" },
    EASY_FALL: { zh: "易跌", en: "Easy Fall" },
    BOUNDARY: { zh: "交界", en: "Boundary" },
};

// Stock Quote types for Stock Inspector
export interface QuoteData {
    symbol: string;
    price: number;
    change_percent: number;
    volume: number;
    trade_value: number;
    ma5: number;
    ma20: number;
    ma60: number;
    deviation_ma20: number;
    deviation_ma60: number;
    company_name: string;
    // MACD Data
    macd_histogram: number;
    macd_histogram_days: number; // Positive = red/bullish days, Negative = green/bearish days
    macd_trend_status: string;   // STRONG_BULL, WEAKENING_BULL, STRONG_BEAR, WEAKENING_BEAR
    macd_weekly_trend: "UP" | "DOWN" | "FLAT";
}

// Strategy types based on Gate status
export type StrategyType = "OFFICE" | "BOSS";

// Sub-strategies for each main strategy
export type OfficeSubStrategy = "STRONG_WEEKLY" | "WEEKLY_TREND";
export type BossSubStrategy = "WEEKLY_PULLBACK" | "CHEAP_ACQUISITION";
export type SubStrategyType = OfficeSubStrategy | BossSubStrategy;

export const STRATEGY_LABELS: Record<StrategyType, { name: string; zh: string }> = {
    OFFICE: { name: "Office Worker", zh: "上班族型" },
    BOSS: { name: "Boss Strategy", zh: "老闆型" },
};

export const SUB_STRATEGY_LABELS: Record<SubStrategyType, { name: string; zh: string }> = {
    STRONG_WEEKLY: { name: "Strong Weekly", zh: "強勢週/追漲" },
    WEEKLY_TREND: { name: "Weekly Trend", zh: "週趨勢/買拉回" },
    WEEKLY_PULLBACK: { name: "Weekly Pullback", zh: "週拉回" },
    CHEAP_ACQUISITION: { name: "Cheap Acquisition", zh: "廉價收購" },
};

// Verdict status from strategy diagnosis
export type VerdictStatus = "BUY" | "WAIT" | "DANGER" | "INFO";

// Strategy verdict returned by getStrategyVerdict()
export interface StrategyVerdict {
    status: VerdictStatus;
    message: string;
    batchAdvice?: string;
    entryAdvice?: string;
    timeWarning?: string;
}
