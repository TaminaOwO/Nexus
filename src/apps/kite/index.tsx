import { useMemo, useState } from "react";
import { useWindHistory } from "./hooks/useWindHistory";
import { calculateStructure } from "./utils/calculateStructure";
import { getGateLight } from "./utils/getGateLight";
import { WindCockpitUI } from "./components/WindCockpit";
import { StockInspector } from "./components/StockInspector";
import { TradeJournal } from "./components/TradeJournal";
import { TradeHistory } from "./components/TradeHistory";
import { StructureType, StrategyType } from "./types";
import "./kite.css";

// Determine strategy based on structure
function getStrategy(structure: StructureType): StrategyType {
    // Easy Rise (Bullish) = OFFICE Strategy (momentum chaser) 🏢
    // Easy Fall or Boundary (Bearish/Mixed) = BOSS Strategy (value guard) 🛡️
    return structure === "EASY_RISE" ? "OFFICE" : "BOSS";
}

type ViewType = "active" | "history";

function Kite() {
    const windState = useWindHistory();
    const [activeView, setActiveView] = useState<ViewType>("active");

    // Calculate structure and gate at dashboard level
    const structure = useMemo(
        () => calculateStructure(windState.history),
        [windState.history]
    );

    const gateLight = useMemo(
        () => getGateLight(structure, windState.todayWind),
        [structure, windState.todayWind]
    );

    const strategy = useMemo(
        () => getStrategy(structure),
        [structure]
    );

    return (
        <div className="kite-dashboard">
            {/* Navigation Tabs */}
            <div className="kite-nav-tabs">
                <button
                    className={`nav-tab ${activeView === "active" ? "active" : ""}`}
                    onClick={() => setActiveView("active")}
                >
                    📊 Active Portfolio
                </button>
                <button
                    className={`nav-tab ${activeView === "history" ? "active" : ""}`}
                    onClick={() => setActiveView("history")}
                >
                    📈 Trade History
                </button>
            </div>

            <div className="kite-content-wrapper">
                {activeView === "active" ? (
                    <>
                        <WindCockpitUI
                            windState={windState}
                            structure={structure}
                            gateLight={gateLight}
                        />
                        <StockInspector
                            gateLight={gateLight}
                            strategy={strategy}
                            structure={structure}
                        />
                        <TradeJournal />
                    </>
                ) : (
                    <TradeHistory />
                )}
            </div>
        </div>
    );
}

export default Kite
