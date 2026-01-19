import { useState, useMemo } from "react";
import { getDateString } from "../hooks/useWindHistory";
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

// Color mapping for history strip dots
const WIND_DOT_COLORS: Record<WindType, string> = {
    STRONG: "#ef4444",    // Red - bullish
    TURBULENT: "#f97316", // Orange - bullish
    GUSTY: "#22c55e",     // Green - bearish
    CALM: "#3b82f6",      // Blue - bearish
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

export function WindCockpitUI({ windState, structure, gateLight }: WindCockpitUIProps) {
    const { history, todayWind, recordWind, setHistoryForDate, clearHistory } = windState;
    const [devModeOpen, setDevModeOpen] = useState(false);
    const [lastWeekWindOpen, setLastWeekWindOpen] = useState(false);
    const [lastWeekOverride, setLastWeekOverride] = useState<WindType | null>(null);

    // Get last 5 days for history strip (including empty slots)
    const historyStrip = useMemo(() => {
        const days: { date: string; wind: WindType | null; label: string }[] = [];
        for (let i = 4; i >= 0; i--) {
            const date = getDateString(i);
            const record = history.find((r) => r.date === date);
            const label = i === 0 ? "Today" : i === 1 ? "Yesterday" : `${i} days ago`;
            days.push({
                date,
                wind: record?.wind ?? null,
                label,
            });
        }
        return days;
    }, [history]);

    // Dev mode: past 4 days for editing (not today)
    const editableDays = useMemo(() => {
        return [1, 2, 3, 4].map((daysAgo) => {
            const date = getDateString(daysAgo);
            const record = history.find((r) => r.date === date);
            return {
                date,
                daysAgo,
                wind: record?.wind ?? null,
                label: daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`,
            };
        });
    }, [history]);

    const structureInfo = STRUCTURE_LABELS[structure];

    const gateLightText = {
        GREEN: "🟢 Go Signal",
        YELLOW: "🟡 Caution",
        RED: "🔴 Stop",
    };

    return (
        <div className="wind-cockpit">
            <h1>🪁 Wind Cockpit</h1>
            <p>Smart Wind Calculator - Track winds, calculate cycles</p>

            {/* Structure Display */}
            <div className="structure-card">
                <div className="cycle-display">
                    <span className="emoji">{structureInfo.emoji}</span>
                    <span className="label">
                        {structureInfo.en}
                        <span>({structureInfo.zh})</span>
                    </span>
                </div>

                {/* History Strip - 5 colored dots */}
                <div className="history-strip">
                    {historyStrip.map((day) => (
                        <div
                            key={day.date}
                            className={`strip-dot ${day.wind ? "filled" : "empty"}`}
                            style={{
                                backgroundColor: day.wind ? WIND_DOT_COLORS[day.wind] : undefined,
                            }}
                            title={`${day.label}: ${day.wind ? WIND_LABELS[day.wind].en : "No data"}`}
                        />
                    ))}
                </div>

                {/* Traffic Light */}
                <div className="traffic-light">
                    <div className="lights">
                        <div className={`light red ${gateLight === "RED" ? "active" : ""}`} />
                        <div className={`light yellow ${gateLight === "YELLOW" ? "active" : ""}`} />
                        <div className={`light green ${gateLight === "GREEN" ? "active" : ""}`} />
                    </div>
                    <span className="status-text">{gateLightText[gateLight]}</span>
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

            {/* Dev Mode & Last Week Wind Buttons */}
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
                <button
                    onClick={() => setLastWeekWindOpen(true)}
                    style={{
                        padding: '0.75rem 1.25rem',
                        background: 'rgba(8, 145, 178, 0.2)',
                        border: '1px solid rgba(8, 145, 178, 0.5)',
                        borderRadius: '0.5rem',
                        color: '#67e8f9',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    📥 設定上週風度 (Set LW)
                    {lastWeekOverride && (
                        <span style={{
                            background: 'rgba(8, 145, 178, 0.5)',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <WindIcon type={lastWeekOverride} className="w-4 h-4" />
                        </span>
                    )}
                </button>
            </div>

            {/* Last Week Wind Modal */}
            {lastWeekWindOpen && (
                <div
                    onClick={() => setLastWeekWindOpen(false)}
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
                            📥 設定上週風度 (Last Week's Wind)
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Select the wind type from the App to override the baseline for this week's calculation.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                            {WIND_OPTIONS.map((windType) => {
                                const info = WIND_LABELS[windType];
                                const isSelected = lastWeekOverride === windType;
                                return (
                                    <button
                                        key={windType}
                                        onClick={() => {
                                            setLastWeekOverride(windType);
                                            setLastWeekWindOpen(false);
                                        }}
                                        style={{
                                            padding: '1rem',
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
                                        <WindIcon type={windType} className="w-10 h-10" />
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>{info.en}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{info.zh}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {lastWeekOverride && (
                            <button
                                onClick={() => {
                                    setLastWeekOverride(null);
                                    setLastWeekWindOpen(false);
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
                                🗑️ Clear Override
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
                        Simulate past winds to test cycle calculation logic.
                    </p>
                    {editableDays.map((day) => (
                        <div key={day.date} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem', width: '6rem' }}>{day.label}</span>
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

