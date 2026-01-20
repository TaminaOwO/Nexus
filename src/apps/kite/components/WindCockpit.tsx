import { useState, useMemo } from "react";
import { getLastNTradingDays } from "../hooks/useWindHistory";
import { WindType, WindRecord, StructureType, GateLight, WIND_LABELS, STRUCTURE_LABELS } from "../types";
import { IconStrongWind, IconTurbulence, IconGust, IconNoWind, IconWind, IconSettings } from "../../../components/HandDrawnIcons";
import "./WindCockpit.css";

const WIND_OPTIONS: WindType[] = ["STRONG", "TURBULENT", "GUSTY", "CALM"];

// Map wind types to components
const WindIcon = ({ type, className }: { type: WindType; className?: string }) => {
    switch (type) {
        case "STRONG": return <IconStrongWind className={className} />;
        case "TURBULENT": return <IconTurbulence className={className} />;
        case "GUSTY": return <IconGust className={className} />;
        case "CALM": return <IconNoWind className={className} />;
        default: return <IconWind className={className} />;
    }
};

// Props interface for the UI component
interface WindCockpitUIProps {
    windState: {
        history: WindRecord[];
        todayWind: WindType | null;
        recordWind: (wind: WindType) => void;
        setHistoryForDate: (date: string, wind: WindType | null) => void;
        clearHistory: () => void;
    };
    structure: StructureType;
    gateLight: GateLight;
}

// Gate light emoji mapping (icons only, no text)
const GATE_LIGHT_EMOJI: Record<GateLight, string> = {
    GREEN: "🟢",
    YELLOW: "🟡",
    RED: "🔴",
};

export function WindCockpitUI({ windState, structure, gateLight }: WindCockpitUIProps) {
    const { history, todayWind, recordWind, setHistoryForDate, clearHistory } = windState;
    const [devModeOpen, setDevModeOpen] = useState(false);
    const [lastWeekCycleOpen, setLastWeekCycleOpen] = useState(false);
    const [lastWeekCycle, setLastWeekCycle] = useState<StructureType | null>(null);

    // Get last 5 trading days for history strip (using trading day logic)
    const historyStrip = useMemo(() => {
        const tradingDays = getLastNTradingDays(5);
        const days: { date: string; wind: WindType | null; dayLabel: string }[] = [];

        tradingDays.forEach((dateStr, index) => {
            const record = history.find((r) => r.date === dateStr);
            days.push({
                date: dateStr,
                wind: record?.wind ?? null,
                dayLabel: `-${5 - index}`, // -5, -4, -3, -2, -1
            });
        });

        return days;
    }, [history]);

    // Dev mode: past 5 trading days for editing
    const editableDays = useMemo(() => {
        const tradingDays = getLastNTradingDays(5);
        return tradingDays.map((dateStr, index) => {
            const record = history.find((r) => r.date === dateStr);
            return {
                date: dateStr,
                wind: record?.wind ?? null,
                label: `-${5 - index}`,
            };
        });
    }, [history]);

    const structureInfo = STRUCTURE_LABELS[structure];

    // Cycle options for Last Week Cycle modal
    const CYCLE_OPTIONS: StructureType[] = ["EASY_RISE", "EASY_FALL", "BOUNDARY"];

    return (
        <div className="wind-cockpit">
            <h1>🪁 Wind Cockpit</h1>
            <p>Smart Wind Calculator - Track winds, calculate cycles</p>

            {/* Last Week Cycle Setting Card */}
            <div className="last-week-cycle-card">
                <div className="last-week-cycle-content">
                    <span className="last-week-label">📥 上週循環:</span>
                    {lastWeekCycle ? (
                        <span className="last-week-value">
                            {STRUCTURE_LABELS[lastWeekCycle].emoji} {STRUCTURE_LABELS[lastWeekCycle].zh}循環
                        </span>
                    ) : (
                        <span className="last-week-value empty">未設定</span>
                    )}
                    <button
                        className="edit-btn"
                        onClick={() => setLastWeekCycleOpen(true)}
                    >
                        編輯
                    </button>
                </div>
            </div>

            {/* Structure Display Card with History Strip Inside */}
            <div className="structure-card">
                {/* History Strip - 5 trading days with labels */}
                <div className="history-strip-container">
                    <div className="history-strip-labels">
                        {historyStrip.map((day) => (
                            <span key={day.date} className="day-label">{day.dayLabel}</span>
                        ))}
                    </div>
                    <div className="history-strip-icons">
                        {historyStrip.map((day) => (
                            <div
                                key={day.date}
                                className={`strip-icon ${day.wind ? "filled" : "empty"}`}
                                title={`${day.date}: ${day.wind ? WIND_LABELS[day.wind].zh : "無資料"}`}
                            >
                                {day.wind ? (
                                    <WindIcon type={day.wind} className="w-8 h-8" />
                                ) : (
                                    <span className="empty-dot">•</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cycle Display with Gate Light */}
                <div className="cycle-row">
                    <div className="cycle-display">
                        <span className="emoji">{structureInfo.emoji}</span>
                        <span className="label">
                            {structureInfo.en}
                            <span>({structureInfo.zh})</span>
                        </span>
                    </div>
                    <div className="gate-light-icon">
                        {GATE_LIGHT_EMOJI[gateLight]}
                    </div>
                </div>
            </div>

            {/* Wind Input Buttons */}
            <div style={{ marginTop: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Today's Wind</h2>
                <div className="wind-grid">
                    {WIND_OPTIONS.map((windType) => {
                        const info = WIND_LABELS[windType];
                        const isSelected = todayWind === windType;
                        return (
                            <button
                                key={windType}
                                onClick={() => recordWind(windType)}
                                style={{
                                    height: '8rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    background: isSelected
                                        ? 'rgba(245, 158, 11, 0.15)'
                                        : 'var(--bg-surface)',
                                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-default)',
                                    borderRadius: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    boxShadow: isSelected ? '0 8px 20px rgba(245, 158, 11, 0.2)' : 'none',
                                    transform: isSelected ? 'translateY(-4px)' : 'none',
                                    color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                                }}
                            >
                                <WindIcon type={windType} className="w-12 h-12" />
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{info.en}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{info.zh}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dev Mode Button */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setDevModeOpen(!devModeOpen)}
                    style={{
                        padding: '0.75rem 1.25rem',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.5rem',
                        color: '#94a3b8',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <IconSettings className="w-4 h-4" /> {devModeOpen ? "Close Dev Mode" : "Edit History"}
                </button>
            </div>

            {/* Last Week Cycle Modal */}
            {lastWeekCycleOpen && (
                <div
                    onClick={() => setLastWeekCycleOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: '1rem',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
                            border: '1px solid rgba(8, 145, 178, 0.3)',
                            borderRadius: '1rem',
                            width: '100%',
                            maxWidth: '420px',
                            padding: '1.5rem',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                        }}
                    >
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#67e8f9' }}>
                            📥 設定上週循環
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                            選擇上週的市場循環狀態，作為本週循環計算的基準。
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            {CYCLE_OPTIONS.map((cycleType) => {
                                const info = STRUCTURE_LABELS[cycleType];
                                const isSelected = lastWeekCycle === cycleType;
                                return (
                                    <button
                                        key={cycleType}
                                        onClick={() => {
                                            setLastWeekCycle(cycleType);
                                            setLastWeekCycleOpen(false);
                                        }}
                                        style={{
                                            padding: '1rem 0.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            background: isSelected ? 'rgba(8, 145, 178, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                                            border: isSelected ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <span style={{ fontSize: '2rem' }}>{info.emoji}</span>
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{info.zh}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{info.en}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {lastWeekCycle && (
                            <button
                                onClick={() => {
                                    setLastWeekCycle(null);
                                    setLastWeekCycleOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    marginTop: '1rem',
                                    padding: '0.625rem',
                                    background: 'transparent',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    borderRadius: '0.5rem',
                                    color: '#f87171',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                }}
                            >
                                🗑️ 清除設定
                            </button>
                        )}
                    </div>
                </div>
            )}

            {devModeOpen && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '0.75rem',
                    marginTop: '1rem',
                }}>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                        編輯過去 5 個交易日的風度紀錄。
                    </p>
                    {editableDays.map((day) => (
                        <div key={day.date} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem', width: '6rem' }}>
                                {day.label} ({day.date.slice(5)})
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {WIND_OPTIONS.map((windType) => {
                                    const info = WIND_LABELS[windType];
                                    const isSelected = day.wind === windType;
                                    return (
                                        <button
                                            key={windType}
                                            onClick={() => setHistoryForDate(day.date, windType)}
                                            title={info.en}
                                            style={{
                                                width: '2.5rem',
                                                height: '2.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(55, 65, 81, 0.6)',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: isSelected ? '0 0 0 2px #6366f1' : 'none',
                                            }}
                                        >
                                            <WindIcon type={windType} className="w-6 h-6" />
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setHistoryForDate(day.date, null)}
                                    title="Clear"
                                    style={{
                                        width: '2.5rem',
                                        height: '2.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: !day.wind ? 'rgba(127, 29, 29, 0.3)' : 'rgba(55, 65, 81, 0.6)',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        color: '#f87171',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: !day.wind ? '0 0 0 2px #ef4444' : 'none',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={clearHistory}
                        style={{
                            width: '100%',
                            padding: '0.625rem',
                            marginTop: '0.5rem',
                            background: 'transparent',
                            border: '1px solid rgba(127, 29, 29, 0.5)',
                            borderRadius: '0.5rem',
                            color: '#f87171',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        🗑️ Clear All History
                    </button>
                </div>
            )}
        </div>
    );
}
