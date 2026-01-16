import { QuoteData, StructureType, SubStrategyType, StrategyVerdict } from "../types";

/**
 * Get the current time status for trading
 */
export function getTimeStatus(): { isVolatile: boolean; isClosed: boolean; message: string } {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 100 + minutes;

    if (time < 900) {
        return { isVolatile: false, isClosed: true, message: "⏰ 盤前 Market Pre-Open" };
    }
    if (time >= 900 && time < 930) {
        return { isVolatile: true, isClosed: false, message: "⚠️ 高波動時段 (09:00-09:30)" };
    }
    if (time >= 1330) {
        return { isVolatile: false, isClosed: true, message: "⏰ 盤後 Market Closed" };
    }
    return { isVolatile: false, isClosed: false, message: "" };
}

/**
 * Get batch and entry advice based on market cycle
 */
function getBossAdvice(structure: StructureType): { batches: string; entry: string } {
    switch (structure) {
        case "EASY_RISE":
            return {
                batches: "分 3~5 批 (3-5 Batches)",
                entry: "靠近月線 or 破月線 (Near/Below 20MA)"
            };
        case "BOUNDARY":
            return {
                batches: "分 5~10 批 (5-10 Batches)",
                entry: "破月線後再開始 (After Breaking 20MA)"
            };
        case "EASY_FALL":
        default:
            return {
                batches: "分 10~15 批 (10-15 Batches)",
                entry: "破月線 or 靠近季線 (Below 20MA/Near 60MA)"
            };
    }
}

/**
 * Main diagnosis function for strategy verdict
 */
export function getStrategyVerdict(
    quote: QuoteData,
    structure: StructureType,
    subStrategy: SubStrategyType,
    revenueYoyChecked: boolean
): StrategyVerdict {
    const timeStatus = getTimeStatus();

    switch (subStrategy) {
        // ========================
        // OFFICE: Strong Weekly (強勢週)
        // ========================
        case "STRONG_WEEKLY": {
            const isDailyMacdPositive = quote.macd_histogram_days > 0;
            const isEarlyEntry = quote.macd_histogram_days <= 2;
            const isWeeklyUp = quote.macd_weekly_trend === "UP";

            let verdict: StrategyVerdict;

            if (isDailyMacdPositive && isEarlyEntry && isWeeklyUp) {
                if (structure === "EASY_RISE") {
                    verdict = {
                        status: "BUY",
                        message: "✅ 絕佳進場! Prime Time - High Win Rate",
                    };
                } else {
                    verdict = {
                        status: "WAIT",
                        message: "⚠️ 非易漲期，勝率降低 Low Win Rate - Reduce Size",
                    };
                }
            } else if (!isWeeklyUp) {
                verdict = {
                    status: "DANGER",
                    message: "❌ 週線未轉強 Weekly MACD is not UP. Wait.",
                };
            } else if (!isDailyMacdPositive) {
                verdict = {
                    status: "INFO",
                    message: "❄️ 日MACD未翻紅 Daily MACD not positive yet.",
                };
            } else {
                verdict = {
                    status: "WAIT",
                    message: `⏳ Day ${quote.macd_histogram_days} - 追高風險提升 Chasing High`,
                };
            }

            // Add time warning
            if (timeStatus.isVolatile) {
                verdict.timeWarning = timeStatus.message;
            }

            return verdict;
        }

        // ========================
        // OFFICE: Weekly Trend (週趨勢)
        // ========================
        case "WEEKLY_TREND": {
            const isWeeklyUp = quote.macd_weekly_trend === "UP";
            const near5MA = quote.price <= quote.ma5 * 1.015; // Within 1.5% of 5MA

            if (!isWeeklyUp) {
                return {
                    status: "DANGER",
                    message: "❌ 週趨勢向下 Weekly Trend is DOWN - Wait for reversal",
                };
            }

            if (near5MA) {
                return {
                    status: "BUY",
                    message: "✅ 進入買區! In Buy Zone (Near 5MA)",
                };
            }

            const deviation = ((quote.price - quote.ma5) / quote.ma5) * 100;
            return {
                status: "WAIT",
                message: `⚠️ 價格偏離5MA ${deviation.toFixed(1)}% - Wait for pullback`,
            };
        }

        // ========================
        // BOSS: Weekly Pullback / Cheap Acquisition
        // ========================
        case "WEEKLY_PULLBACK":
        case "CHEAP_ACQUISITION": {
            // Pre-requisite check
            if (!revenueYoyChecked) {
                return {
                    status: "DANGER",
                    message: "🚫 請先確認營收YOY > 30% (Mandatory Check)",
                };
            }

            const advice = getBossAdvice(structure);
            const deviation20MA = quote.deviation_ma20;
            const deviation60MA = quote.deviation_ma60;

            let verdict: StrategyVerdict = {
                status: "INFO",
                message: "",
                batchAdvice: advice.batches,
                entryAdvice: advice.entry,
            };

            // Check entry conditions based on cycle
            if (structure === "EASY_RISE") {
                if (deviation20MA <= 0) {
                    verdict.status = "BUY";
                    verdict.message = "✅ 破月線! 甜蜜買區 Below 20MA - Buy Zone";
                } else if (deviation20MA <= 3) {
                    verdict.status = "BUY";
                    verdict.message = "✅ 靠近月線! Near 20MA - Good Entry";
                } else {
                    verdict.status = "WAIT";
                    verdict.message = `⏳ 距月線 ${formatPercent(deviation20MA)} - Wait for pullback`;
                }
            } else if (structure === "BOUNDARY") {
                if (deviation20MA <= 0) {
                    verdict.status = "BUY";
                    verdict.message = "✅ 破月線! 開始分批進場 Breaking 20MA";
                } else {
                    verdict.status = "WAIT";
                    verdict.message = "⏳ 等待破月線後再進場 Wait for break below 20MA";
                }
            } else {
                // EASY_FALL
                if (deviation20MA <= 0 && deviation60MA <= 5) {
                    verdict.status = "BUY";
                    verdict.message = "✅ 破月線且靠近季線! Prime Buy Zone";
                } else if (deviation20MA <= 0) {
                    verdict.status = "BUY";
                    verdict.message = "✅ 破月線! 可開始分批 Below 20MA";
                } else if (deviation60MA <= 5) {
                    verdict.status = "BUY";
                    verdict.message = "✅ 靠近季線! Near 60MA";
                } else {
                    verdict.status = "WAIT";
                    verdict.message = "⏳ 等待破月線或靠近季線 Wait for entry zone";
                }
            }

            return verdict;
        }

        default:
            return {
                status: "INFO",
                message: "Select a sub-strategy",
            };
    }
}

function formatPercent(value: number): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}
