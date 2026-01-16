import { WindRecord, StructureType } from "../types";

/**
 * Calculate the market structure (cycle) based on the last 5 days of wind history.
 * 
 * - Easy Rise (易漲): Majority are STRONG or TURBULENT (bullish winds)
 * - Easy Fall (易跌): Majority are GUSTY or CALM (bearish winds)
 * - Boundary (交界): Mixed signals or insufficient data
 */
export function calculateStructure(history: WindRecord[]): StructureType {
    // Get last 5 entries
    const recentHistory = history.slice(-5);

    // Need at least 1 entry to make any assessment
    if (recentHistory.length === 0) {
        return "BOUNDARY";
    }

    // Count bullish vs bearish winds
    let bullishCount = 0;
    let bearishCount = 0;

    for (const record of recentHistory) {
        if (record.wind === "STRONG" || record.wind === "TURBULENT") {
            bullishCount++;
        } else {
            bearishCount++;
        }
    }

    // Determine majority (need more than half)
    const total = recentHistory.length;
    const majorityThreshold = total / 2;

    if (bullishCount > majorityThreshold) {
        return "EASY_RISE";
    } else if (bearishCount > majorityThreshold) {
        return "EASY_FALL";
    } else {
        return "BOUNDARY";
    }
}
