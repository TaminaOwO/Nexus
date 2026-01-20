// Wind types for the Smart Wind Calculator

export type WindType = "STRONG" | "TURBULENT" | "GUSTY" | "CALM";

export interface WindRecord {
    date: string; // ISO date string (YYYY-MM-DD)
    wind: WindType;
}

export type StructureType = "EASY_RISE" | "EASY_FALL" | "BOUNDARY";

export type GateLight = "GREEN" | "YELLOW" | "RED";

// Display labels for UI
export const WIND_LABELS: Record<WindType, { emoji: string; zh: string; en: string }> = {
    STRONG: { emoji: "🦅", zh: "強風", en: "Strong" },
    TURBULENT: { emoji: "🌪️", zh: "亂流", en: "Turbulent" },
    GUSTY: { emoji: "🍃", zh: "陣風", en: "Gusty" },
    CALM: { emoji: "🐢", zh: "無風", en: "Calm" },
};

export const STRUCTURE_LABELS: Record<StructureType, { emoji: string; zh: string; en: string }> = {
    EASY_RISE: { emoji: "📈", zh: "易漲", en: "Easy Rise" },
    EASY_FALL: { emoji: "📉", zh: "易跌", en: "Easy Fall" },
    BOUNDARY: { emoji: "🌀", zh: "交界", en: "Boundary" },
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
    macd_weekly_trend: "UP" | "DOWN" | "FLAT";
}

// Strategy types based on Gate status
export type StrategyType = "OFFICE" | "BOSS";

// Sub-strategies for each main strategy
export type OfficeSubStrategy = "STRONG_WEEKLY" | "WEEKLY_TREND";
export type BossSubStrategy = "WEEKLY_PULLBACK" | "CHEAP_ACQUISITION";
export type SubStrategyType = OfficeSubStrategy | BossSubStrategy;

export const STRATEGY_LABELS: Record<StrategyType, { badge: string; name: string; zh: string }> = {
    OFFICE: { badge: "🏢", name: "Office Worker", zh: "上班族型" },
    BOSS: { badge: "🛡️", name: "Boss Strategy", zh: "老闆型" },
};

export const SUB_STRATEGY_LABELS: Record<SubStrategyType, { badge: string; name: string; zh: string }> = {
    STRONG_WEEKLY: { badge: "⚡", name: "Strong Weekly", zh: "強勢週/追漲" },
    WEEKLY_TREND: { badge: "📉", name: "Weekly Trend", zh: "週趨勢/買拉回" },
    WEEKLY_PULLBACK: { badge: "🔄", name: "Weekly Pullback", zh: "週拉回" },
    CHEAP_ACQUISITION: { badge: "🏷️", name: "Cheap Acquisition", zh: "廉價收購" },
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
