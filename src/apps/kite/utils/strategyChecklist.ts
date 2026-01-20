import { QuoteData, StructureType, SubStrategyType, WindType } from "../types";

export interface ConditionItem {
    id: string;
    label: string;
    met: boolean;
    currentValue?: string;
    expectedValue?: string;
}

// Wind suitability mapping per strategy
const WIND_SUITABILITY: Record<SubStrategyType, WindType[]> = {
    STRONG_WEEKLY: ["STRONG", "GUSTY"],
    WEEKLY_TREND: ["STRONG", "GUSTY"],
    WEEKLY_PULLBACK: ["STRONG", "TURBULENT", "GUSTY"],
    CHEAP_ACQUISITION: ["STRONG", "TURBULENT", "GUSTY", "CALM"], // All winds
};

/**
 * Get all conditions for a strategy as a checklist
 */
export function getStrategyChecklist(
    quote: QuoteData | null,
    structure: StructureType,
    subStrategy: SubStrategyType,
    currentWind: WindType | null,
    revenueYoyChecked: boolean
): ConditionItem[] {
    const conditions: ConditionItem[] = [];

    // Wind suitability check
    const suitableWinds = WIND_SUITABILITY[subStrategy];
    const windMet = currentWind ? suitableWinds.includes(currentWind) : false;
    conditions.push({
        id: "wind",
        label: `適合風度: ${suitableWinds.join(", ")}`,
        met: windMet,
        currentValue: currentWind || "未設定",
        expectedValue: suitableWinds.join("/"),
    });

    if (!quote) {
        return conditions;
    }

    switch (subStrategy) {
        case "STRONG_WEEKLY": {
            const isWeeklyUp = quote.macd_weekly_trend === "UP";
            const isDailyMacdPositive = quote.macd_histogram_days > 0;
            const isEarlyEntry = quote.macd_histogram_days <= 2;
            const isBullishCycle = structure === "EASY_RISE";

            conditions.push({
                id: "weekly_macd",
                label: "週 MACD 趨勢向上",
                met: isWeeklyUp,
                currentValue: quote.macd_weekly_trend,
                expectedValue: "UP",
            });
            conditions.push({
                id: "daily_macd",
                label: "日 MACD 紅柱",
                met: isDailyMacdPositive,
                currentValue: `${quote.macd_histogram_days} 天`,
                expectedValue: "> 0",
            });
            conditions.push({
                id: "early_entry",
                label: "日 MACD 紅柱 ≤ 2天 (早期進場)",
                met: isEarlyEntry,
                currentValue: `${quote.macd_histogram_days} 天`,
                expectedValue: "≤ 2",
            });
            conditions.push({
                id: "cycle",
                label: "循環為易漲 (高勝率)",
                met: isBullishCycle,
                currentValue: structure,
                expectedValue: "EASY_RISE",
            });
            break;
        }

        case "WEEKLY_TREND": {
            const isWeeklyUp = quote.macd_weekly_trend === "UP";
            const near5MA = quote.price <= quote.ma5 * 1.015;
            const deviation5MA = ((quote.price - quote.ma5) / quote.ma5) * 100;

            conditions.push({
                id: "weekly_macd",
                label: "週 MACD 趨勢向上",
                met: isWeeklyUp,
                currentValue: quote.macd_weekly_trend,
                expectedValue: "UP",
            });
            conditions.push({
                id: "near_5ma",
                label: "價格靠近5日均線 (1.5%內)",
                met: near5MA,
                currentValue: `${deviation5MA.toFixed(2)}%`,
                expectedValue: "≤ 1.5%",
            });
            break;
        }

        case "WEEKLY_PULLBACK":
        case "CHEAP_ACQUISITION": {
            const deviation20MA = quote.deviation_ma20;
            const deviation60MA = quote.deviation_ma60;

            conditions.push({
                id: "revenue_yoy",
                label: "營收YOY > 30% (手動確認)",
                met: revenueYoyChecked,
                currentValue: revenueYoyChecked ? "已確認" : "未確認",
                expectedValue: "已確認",
            });

            // Conditions based on cycle
            if (structure === "EASY_RISE") {
                const nearOrBelow20MA = deviation20MA <= 3;
                conditions.push({
                    id: "near_20ma",
                    label: "靠近月線或破月線 (偏離≤3%)",
                    met: nearOrBelow20MA,
                    currentValue: `${deviation20MA.toFixed(2)}%`,
                    expectedValue: "≤ 3%",
                });
            } else if (structure === "BOUNDARY") {
                const below20MA = deviation20MA <= 0;
                conditions.push({
                    id: "below_20ma",
                    label: "破月線 (偏離≤0%)",
                    met: below20MA,
                    currentValue: `${deviation20MA.toFixed(2)}%`,
                    expectedValue: "≤ 0%",
                });
            } else {
                // EASY_FALL
                const below20MA = deviation20MA <= 0;
                const near60MA = deviation60MA <= 5;
                conditions.push({
                    id: "below_20ma",
                    label: "破月線",
                    met: below20MA,
                    currentValue: `${deviation20MA.toFixed(2)}%`,
                    expectedValue: "≤ 0%",
                });
                conditions.push({
                    id: "near_60ma",
                    label: "靠近季線 (偏離≤5%)",
                    met: near60MA,
                    currentValue: `${deviation60MA.toFixed(2)}%`,
                    expectedValue: "≤ 5%",
                });
            }
            break;
        }
    }

    return conditions;
}

/**
 * Get overall status from checklist
 */
export function getChecklistStatus(conditions: ConditionItem[]): {
    total: number;
    passed: number;
    percentage: number;
    allPassed: boolean;
} {
    const total = conditions.length;
    const passed = conditions.filter(c => c.met).length;
    return {
        total,
        passed,
        percentage: total > 0 ? (passed / total) * 100 : 0,
        allPassed: passed === total,
    };
}
