import { useMemo, useState } from "react";
import { useWindHistory } from "./hooks/useWindHistory";
import { calculateStructure } from "./utils/calculateStructure";
import { getGateLight } from "./utils/getGateLight";
import { WindCockpitUI } from "./components/WindCockpit";
import { StockInspector } from "./components/StockInspector";
import { TradeJournal } from "./components/TradeJournal";
import { TradeHistory } from "./components/TradeHistory";
import { Watchlist } from "./components/Watchlist";
import { StructureType, StrategyType } from "./types";
import "./kite.css";

// Determine strategy based on structure
function getStrategy(structure: StructureType): StrategyType {
    // Easy Rise (Bullish) = OFFICE Strategy (momentum chaser) 🏢
    // Easy Fall or Boundary (Bearish/Mixed) = BOSS Strategy (value guard) 🛡️
    return structure === "EASY_RISE" ? "OFFICE" : "BOSS";
}

type ViewType = "active" | "watchlist" | "history";

function Kite() {
    const windState = useWindHistory();
    const [activeView, setActiveView] = useState<ViewType>("active");
    const [inspectorSymbol, setInspectorSymbol] = useState<string>("");

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

    const handleWatchlistSelect = (symbol: string) => {
        setInspectorSymbol(symbol);
        setActiveView("active");
    };

    return (
        <div className="kite-dashboard">
            {/* Navigation Tabs */}
            <div className="kite-nav-tabs">
                <button
                    className={`nav-tab ${activeView === "active" ? "active" : ""}`}
                    onClick={() => setActiveView("active")}
                >
                    📊 Active
                </button>
                <button
                    className={`nav-tab ${activeView === "watchlist" ? "active" : ""}`}
                    onClick={() => setActiveView("watchlist")}
                >
                    👀 Watchlist
                </button>
                <button
                    className={`nav-tab ${activeView === "history" ? "active" : ""}`}
                    onClick={() => setActiveView("history")}
                >
                    📈 History
                </button>
            </div>

            <div className="kite-content-wrapper">
                {activeView === "active" && (
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
                            initialSymbol={inspectorSymbol}
                            currentWind={windState.todayWind}
                        />
                        <TradeJournal />
                    </>
                )}
                {activeView === "watchlist" && (
                    <Watchlist
                        structure={structure}
                        onStockSelect={handleWatchlistSelect}
                    />
                )}
                {activeView === "history" && (
                    <TradeHistory />
                )}
            </div>
        </div>
    );
}

export default Kite

