import { WindType, StructureType, GateLight } from "../types";

/**
 * Determine the gate light (traffic signal) based on structure and today's wind input.
 * 
 * - 🟢 Green: Structure = Easy Rise + Input = Strong
 * - 🟡 Yellow: Structure = Easy Rise + Input = Turbulent/Gusty
 *              OR Structure = Boundary + Input = Strong/Turbulent
 * - 🔴 Red: Structure = Easy Fall + Input = Any
 *           OR Input = Calm (always red, too risky)
 */
export function getGateLight(structure: StructureType, todayWind: WindType | null): GateLight {
    // No input yet - default to yellow (waiting)
    if (todayWind === null) {
        return "YELLOW";
    }

    // Calm wind is always a red light (high risk)
    if (todayWind === "CALM") {
        return "RED";
    }

    // Easy Fall structure - red light for any input
    if (structure === "EASY_FALL") {
        return "RED";
    }

    // Easy Rise structure
    if (structure === "EASY_RISE") {
        if (todayWind === "STRONG") {
            return "GREEN"; // Best case: bullish cycle + strong wind
        } else {
            return "YELLOW"; // Caution: bullish cycle but weaker wind
        }
    }

    // Boundary structure - mixed signals
    if (todayWind === "STRONG") {
        return "YELLOW"; // Could go either way
    } else {
        return "RED"; // Not enough conviction
    }
}
