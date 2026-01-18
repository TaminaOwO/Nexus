import { useState, useCallback, useMemo } from "react";
import {
    QuoteData,
    StrategyType,
    GateLight,
    StructureType,
    STRUCTURE_LABELS,
    SubStrategyType,
    OfficeSubStrategy,
    BossSubStrategy,
} from "../types";
import { getStrategyVerdict } from "../utils/strategyDiagnosis";
import "./StockInspector.css";

interface StockInspectorProps {
    gateLight: GateLight;
    strategy: StrategyType;
    structure: StructureType;
}

const API_BASE = "/api/kite";

// Format large numbers in Chinese style (億/萬)
function formatTradeValue(value: number): string {
    if (value >= 100000000) {
        return `${(value / 100000000).toFixed(2)}億`;
    } else if (value >= 10000) {
        return `${(value / 10000).toFixed(0)}萬`;
    }
    return value.toLocaleString();
}

// Format price with proper decimals
function formatPrice(price: number): string {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format percentage
function formatPercent(value: number): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}

export function StockInspector({ gateLight, strategy: defaultStrategy, structure }: StockInspectorProps) {
    // ============ State ============
    const [symbol, setSymbol] = useState("");
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Strategy selection (tabs)
    const [activeStrategy, setActiveStrategy] = useState<StrategyType>(defaultStrategy);
    const [officeSubStrategy, setOfficeSubStrategy] = useState<OfficeSubStrategy>("STRONG_WEEKLY");
    const [bossSubStrategy, setBossSubStrategy] = useState<BossSubStrategy>("WEEKLY_PULLBACK");

    // Validation checkbox (Boss only)
    const [revenueYoyChecked, setRevenueYoyChecked] = useState(false);

    // Trade modal state
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeForm, setTradeForm] = useState({
        entryPrice: 0,
        quantity: 1, // Default to 1 share
        plannedBatches: 5,
        currentBatch: 1,
        stopLossPrice: 0,
        takeProfitPrice: 0,
    });
    const [tradeSaving, setTradeSaving] = useState(false);
    const [tradeSuccess, setTradeSuccess] = useState(false);

    // ============ Computed ============
    const isDisabled = gateLight === "RED" && activeStrategy === "OFFICE";
    const structureInfo = STRUCTURE_LABELS[structure];
    const isHot = quote && quote.trade_value > 100000000;

    // Current sub-strategy
    const currentSubStrategy: SubStrategyType = activeStrategy === "OFFICE"
        ? officeSubStrategy
        : bossSubStrategy;

    // Strategy verdict
    const verdict = useMemo(() => {
        if (!quote) return null;
        return getStrategyVerdict(quote, structure, currentSubStrategy, revenueYoyChecked);
    }, [quote, structure, currentSubStrategy, revenueYoyChecked]);

    // ============ Handlers ============
    const fetchQuote = useCallback(async () => {
        if (!symbol.trim()) return;

        setLoading(true);
        setError(null);
        setRevenueYoyChecked(false);

        try {
            const response = await fetch(`${API_BASE}/quote?symbol=${encodeURIComponent(symbol.trim())}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to fetch quote");
            }
            const data: QuoteData = await response.json();
            setQuote(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch quote");
            setQuote(null);
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            fetchQuote();
        }
    };

    // Open trade modal
    const openTradeModal = () => {
        if (quote) {
            // Default stop loss at -5% below entry price
            const defaultStopLoss = Math.round(quote.price * 0.95 * 100) / 100;
            setTradeForm(prev => ({
                ...prev,
                entryPrice: quote.price,
                stopLossPrice: defaultStopLoss,
                takeProfitPrice: 0,
            }));
            setTradeSuccess(false);
            setShowTradeModal(true);
        }
    };

    // Get suggested batches based on cycle
    const getSuggestedBatches = () => {
        if (structure === "EASY_RISE") return "3-5 批";
        if (structure === "BOUNDARY") return "5-10 批";
        return "10-15 批";
    };

    // Save trade to backend
    const saveTrade = async () => {
        if (!quote) return;

        setTradeSaving(true);
        try {
            const payload = {
                symbol: quote.symbol,
                company_name: quote.company_name,
                entry_price: tradeForm.entryPrice,
                quantity: tradeForm.quantity,
                planned_batches: tradeForm.plannedBatches,
                current_batch: tradeForm.currentBatch,
                strategy: activeStrategy,
                sub_strategy: currentSubStrategy,
                cycle: structure,
                stop_loss_price: tradeForm.stopLossPrice,
                take_profit_price: tradeForm.takeProfitPrice,
                strategy_snapshot: {
                    ma20_deviation: quote.deviation_ma20,
                    ma60_deviation: quote.deviation_ma60,
                    macd_days: quote.macd_histogram_days,
                    weekly_trend: quote.macd_weekly_trend,
                    current_price: quote.price,
                },
            };

            const response = await fetch(`${API_BASE}/journal`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to save trade");
            }

            setTradeSuccess(true);
            setTimeout(() => setShowTradeModal(false), 1500);
        } catch (err) {
            setError("Failed to save trade");
        } finally {
            setTradeSaving(false);
        }
    };

    // ============ Render ============
    return (
        <div className={`stock-inspector ${isDisabled ? "disabled" : ""}`}>
            {/* Trade Modal */}
            {showTradeModal && quote && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                }} onClick={() => setShowTradeModal(false)}>
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '1rem',
                        width: '100%',
                        maxWidth: '520px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>📝 記錄交易 Log Trade</h3>
                            <button
                                onClick={() => setShowTradeModal(false)}
                                style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    color: '#94a3b8',
                                    fontSize: '1.25rem',
                                    cursor: 'pointer',
                                }}
                            >×</button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Strategy Badge */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                background: activeStrategy === 'BOSS' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                                border: `1px solid ${activeStrategy === 'BOSS' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                                borderRadius: '0.75rem',
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>{activeStrategy === "BOSS" ? "🛡️" : "🏢"}</span>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{activeStrategy} Strategy</div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{currentSubStrategy.replace(/_/g, " ")}</div>
                                </div>
                            </div>

                            {/* Stock Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{quote.company_name}</span>
                                <span style={{ color: '#94a3b8' }}>{quote.symbol}</span>
                            </div>

                            {/* Price & Shares Row */}
                            <div className="form-row">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>🏷️ 價格 Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tradeForm.entryPrice}
                                        onChange={(e) => setTradeForm({ ...tradeForm, entryPrice: parseFloat(e.target.value) || 0 })}
                                        style={{
                                            height: '3rem',
                                            padding: '0 1rem',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '2px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.5rem',
                                            color: 'white',
                                            fontSize: '1rem',
                                            fontFamily: 'monospace',
                                        }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>系統價: ${formatPrice(quote.price)}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>📦 股數 Shares</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1000"
                                        value={tradeForm.quantity}
                                        onChange={(e) => setTradeForm({ ...tradeForm, quantity: parseInt(e.target.value) || 1000 })}
                                        style={{
                                            height: '3rem',
                                            padding: '0 1rem',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '2px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.5rem',
                                            color: 'white',
                                            fontSize: '1rem',
                                            fontFamily: 'monospace',
                                        }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>1張 = 1000股</span>
                                </div>
                            </div>

                            {/* Batches Row */}
                            <div className="form-row">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>💰 預計分批 Batches</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={tradeForm.plannedBatches}
                                        onChange={(e) => setTradeForm({ ...tradeForm, plannedBatches: parseInt(e.target.value) || 1 })}
                                        style={{
                                            height: '3rem',
                                            padding: '0 1rem',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '2px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.5rem',
                                            color: 'white',
                                            fontSize: '1rem',
                                            fontFamily: 'monospace',
                                        }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>建議: {getSuggestedBatches()}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#94a3b8' }}>🎯 第幾批 Current</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={tradeForm.plannedBatches}
                                        value={tradeForm.currentBatch}
                                        onChange={(e) => setTradeForm({ ...tradeForm, currentBatch: parseInt(e.target.value) || 1 })}
                                        style={{
                                            height: '3rem',
                                            padding: '0 1rem',
                                            background: 'rgba(15, 23, 42, 0.6)',
                                            border: '2px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.5rem',
                                            color: 'white',
                                            fontSize: '1rem',
                                            fontFamily: 'monospace',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Exit Plan */}
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '0.75rem',
                            }}>
                                <div style={{ fontSize: '0.9rem', color: '#fca5a5', marginBottom: '0.75rem', fontWeight: 600 }}>🛑 出場計畫 Exit Plan</div>
                                <div className="form-row">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>停損價 Stop Loss *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={tradeForm.stopLossPrice}
                                            onChange={(e) => setTradeForm({ ...tradeForm, stopLossPrice: parseFloat(e.target.value) || 0 })}
                                            style={{
                                                height: '3rem',
                                                padding: '0 1rem',
                                                background: tradeForm.stopLossPrice <= 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                                                border: tradeForm.stopLossPrice <= 0 ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.1)',
                                                borderRadius: '0.5rem',
                                                color: 'white',
                                                fontSize: '1rem',
                                                fontFamily: 'monospace',
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>停利價 Take Profit</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={tradeForm.takeProfitPrice || ""}
                                            onChange={(e) => setTradeForm({ ...tradeForm, takeProfitPrice: parseFloat(e.target.value) || 0 })}
                                            placeholder="選填"
                                            style={{
                                                height: '3rem',
                                                padding: '0 1rem',
                                                background: 'rgba(15, 23, 42, 0.6)',
                                                border: '2px solid rgba(255,255,255,0.1)',
                                                borderRadius: '0.5rem',
                                                color: 'white',
                                                fontSize: '1rem',
                                                fontFamily: 'monospace',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Auto-captured Context */}
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '0.75rem',
                            }}>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>📊 自動擷取 Auto-Captured</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Strategy</div>
                                        <div style={{ fontWeight: 600 }}>{activeStrategy === "BOSS" ? "🛡️" : "🏢"}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cycle</div>
                                        <div style={{ fontWeight: 600 }}>{structureInfo.zh}</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MA20 Dev</div>
                                        <div style={{ fontWeight: 600, color: quote.deviation_ma20 >= 0 ? '#10b981' : '#ef4444' }}>
                                            {formatPercent(quote.deviation_ma20)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            {tradeSuccess ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '1rem',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    borderRadius: '0.75rem',
                                    color: '#6ee7b7',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                }}>✅ 交易已記錄!</div>
                            ) : (
                                <button
                                    onClick={saveTrade}
                                    disabled={tradeSaving || tradeForm.entryPrice <= 0}
                                    style={{
                                        width: '100%',
                                        height: '3.25rem',
                                        background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                                        border: 'none',
                                        borderRadius: '0.75rem',
                                        color: 'white',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        cursor: tradeSaving || tradeForm.entryPrice <= 0 ? 'not-allowed' : 'pointer',
                                        opacity: tradeSaving || tradeForm.entryPrice <= 0 ? 0.5 : 1,
                                    }}
                                >
                                    {tradeSaving ? "保存中..." : "💾 儲存交易 Save Trade"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="inspector-header">
                <h2>📊 Stock Inspector</h2>
                <span className="cycle-badge">
                    {structureInfo.emoji} {structureInfo.zh}
                </span>
            </div>

            {/* Layer 1: Strategy Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveStrategy("OFFICE")}
                    style={{
                        height: '3.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: activeStrategy === "OFFICE"
                            ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                            : 'rgba(30, 41, 59, 0.6)',
                        border: activeStrategy === "OFFICE" ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        color: activeStrategy === "OFFICE" ? 'white' : '#94a3b8',
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: activeStrategy === "OFFICE" ? '0 8px 24px rgba(99, 102, 241, 0.4)' : 'none',
                        transition: 'all 0.2s ease',
                    }}
                >
                    🏢 Office Worker <span style={{ opacity: 0.7, fontWeight: 400 }}>(上班族型)</span>
                </button>
                <button
                    onClick={() => setActiveStrategy("BOSS")}
                    style={{
                        height: '3.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: activeStrategy === "BOSS"
                            ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                            : 'rgba(30, 41, 59, 0.6)',
                        border: activeStrategy === "BOSS" ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        color: activeStrategy === "BOSS" ? '#1e293b' : '#94a3b8',
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: activeStrategy === "BOSS" ? '0 8px 24px rgba(245, 158, 11, 0.4)' : 'none',
                        transition: 'all 0.2s ease',
                    }}
                >
                    🛡️ Boss Strategy <span style={{ opacity: 0.7, fontWeight: 400 }}>(老闆型)</span>
                </button>
            </div>

            {/* Layer 2: Sub-Strategy Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {activeStrategy === "OFFICE" ? (
                    <>
                        <button
                            onClick={() => setOfficeSubStrategy("STRONG_WEEKLY")}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: officeSubStrategy === "STRONG_WEEKLY"
                                    ? 'rgba(99, 102, 241, 0.2)'
                                    : 'transparent',
                                border: officeSubStrategy === "STRONG_WEEKLY"
                                    ? '2px solid #6366f1'
                                    : '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '9999px',
                                color: officeSubStrategy === "STRONG_WEEKLY" ? '#a5b4fc' : '#94a3b8',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            ⚡ 強勢週/追漲
                        </button>
                        <button
                            onClick={() => setOfficeSubStrategy("WEEKLY_TREND")}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: officeSubStrategy === "WEEKLY_TREND"
                                    ? 'rgba(99, 102, 241, 0.2)'
                                    : 'transparent',
                                border: officeSubStrategy === "WEEKLY_TREND"
                                    ? '2px solid #6366f1'
                                    : '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '9999px',
                                color: officeSubStrategy === "WEEKLY_TREND" ? '#a5b4fc' : '#94a3b8',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            📉 週趨勢/買拉回
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setBossSubStrategy("WEEKLY_PULLBACK")}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: bossSubStrategy === "WEEKLY_PULLBACK"
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'transparent',
                                border: bossSubStrategy === "WEEKLY_PULLBACK"
                                    ? '2px solid #f59e0b'
                                    : '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '9999px',
                                color: bossSubStrategy === "WEEKLY_PULLBACK" ? '#fcd34d' : '#94a3b8',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            🔄 週拉回
                        </button>
                        <button
                            onClick={() => setBossSubStrategy("CHEAP_ACQUISITION")}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: bossSubStrategy === "CHEAP_ACQUISITION"
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'transparent',
                                border: bossSubStrategy === "CHEAP_ACQUISITION"
                                    ? '2px solid #f59e0b'
                                    : '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '9999px',
                                color: bossSubStrategy === "CHEAP_ACQUISITION" ? '#fcd34d' : '#94a3b8',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            🏷️ 廉價收購
                        </button>
                    </>
                )}
            </div>

            {isDisabled ? (
                <div className="inspector-disabled">
                    <p>🔴 Gate is STOP - Office Worker Strategy Disabled</p>
                    <p className="hint">Switch to Boss Strategy for pullback analysis</p>
                </div>
            ) : (
                <>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            placeholder="Enter symbol (e.g., 2330, 4979)"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            style={{
                                flex: 1,
                                height: '3.5rem',
                                padding: '0 1.5rem',
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '2px solid rgba(255,255,255,0.1)',
                                borderRadius: '0.75rem',
                                color: '#f1f5f9',
                                fontSize: '1.25rem',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={fetchQuote}
                            disabled={loading || !symbol.trim()}
                            style={{
                                width: '3.5rem',
                                height: '3.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: activeStrategy === "BOSS"
                                    ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                                    : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                border: 'none',
                                borderRadius: '0.75rem',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: loading || !symbol.trim() ? 0.5 : 1,
                            }}
                        >
                            {loading ? "⏳" : "🔍"}
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Quote Display */}
                    {quote && (
                        <div className="quote-card">
                            {/* Stock Info Header - 2 Column Grid */}
                            <div className="stock-header-grid">
                                {/* Price Card */}
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    padding: '1.25rem',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                                        {quote.company_name} ({quote.symbol})
                                    </div>
                                    <div style={{ fontSize: '2.5rem', fontFamily: 'monospace', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.025em' }}>
                                        ${formatPrice(quote.price)}
                                    </div>
                                    <div style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 700,
                                        marginTop: '0.25rem',
                                        color: quote.change_percent >= 0 ? '#ef4444' : '#10b981',
                                    }}>
                                        {quote.change_percent >= 0 ? '↑' : '↓'} {formatPercent(quote.change_percent)}
                                    </div>
                                </div>

                                {/* Trade Value Card */}
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    padding: '1.25rem',
                                    borderRadius: '1rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                                        Trade Value
                                    </div>
                                    <div style={{ fontSize: '2rem', fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24' }}>
                                        {formatTradeValue(quote.trade_value)}
                                    </div>
                                    {isHot && (
                                        <div style={{
                                            marginTop: '0.5rem',
                                            padding: '0.25rem 0.75rem',
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            color: '#fca5a5',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                        }}>
                                            🔥 Hot
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Log Trade Button */}
                            <button
                                onClick={openTradeModal}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    marginBottom: '1rem',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))',
                                    border: '1px solid rgba(99, 102, 241, 0.4)',
                                    borderRadius: '0.75rem',
                                    color: '#c7d2fe',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                📝 記錄進場 Log Trade
                            </button>

                            {/* Boss: Revenue YOY Verification Tile */}
                            {activeStrategy === "BOSS" && (
                                <div
                                    onClick={() => setRevenueYoyChecked(!revenueYoyChecked)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        border: revenueYoyChecked ? '2px solid #10b981' : '2px solid rgba(75, 85, 99, 0.6)',
                                        background: revenueYoyChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        boxShadow: revenueYoyChecked ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none',
                                    }}
                                >
                                    <div style={{
                                        width: '2rem',
                                        height: '2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                    }}>
                                        {revenueYoyChecked ? '✅' : '⬜'}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '1.125rem',
                                            fontWeight: 700,
                                            color: revenueYoyChecked ? '#a7f3d0' : '#9ca3af',
                                        }}>
                                            營收爆發檢查 (YOY &gt; 30%)
                                        </div>
                                        <div style={{
                                            fontSize: '0.875rem',
                                            opacity: 0.7,
                                            color: revenueYoyChecked ? '#a7f3d0' : '#9ca3af',
                                        }}>
                                            Confirm single-month revenue growth is strong
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Verdict Alert Card */}
                            {verdict && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '1rem',
                                    padding: '1.25rem',
                                    borderRadius: '0.75rem',
                                    borderLeft: '6px solid',
                                    marginTop: '1.5rem',
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                    ...(verdict.status === 'BUY' ? {
                                        background: 'rgba(6, 78, 59, 0.4)',
                                        borderLeftColor: '#10b981',
                                    } : verdict.status === 'WAIT' ? {
                                        background: 'rgba(120, 53, 15, 0.4)',
                                        borderLeftColor: '#f59e0b',
                                    } : {
                                        background: 'rgba(127, 29, 29, 0.4)',
                                        borderLeftColor: '#ef4444',
                                    }),
                                }}>
                                    {/* Icon */}
                                    <div style={{
                                        fontSize: '2rem',
                                        lineHeight: 1,
                                    }}>
                                        {verdict.status === 'BUY' ? '✅' : verdict.status === 'WAIT' ? '⚠️' : '🚫'}
                                    </div>
                                    {/* Content */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            marginBottom: '0.5rem',
                                            color: verdict.status === 'BUY' ? '#6ee7b7'
                                                : verdict.status === 'WAIT' ? '#fcd34d'
                                                    : '#fca5a5',
                                        }}>
                                            {verdict.status === 'BUY' ? '🟢 Buy Signal - 可進場'
                                                : verdict.status === 'WAIT' ? '🟡 Caution - 觀察中'
                                                    : '🔴 Stop - 不建議'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.95rem',
                                            color: 'rgba(255,255,255,0.85)',
                                            lineHeight: 1.6,
                                        }}>
                                            {verdict.message}
                                        </div>
                                        {verdict.timeWarning && (
                                            <div style={{
                                                marginTop: '0.75rem',
                                                fontSize: '0.9rem',
                                                color: '#fbbf24',
                                                background: 'rgba(245, 158, 11, 0.15)',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '0.5rem',
                                            }}>
                                                ⏰ {verdict.timeWarning}
                                            </div>
                                        )}
                                        {/* Operational Guide (Boss only) */}
                                        {verdict.batchAdvice && verdict.entryAdvice && (
                                            <div style={{
                                                marginTop: '1rem',
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '0.75rem',
                                            }}>
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    padding: '0.75rem',
                                                    borderRadius: '0.5rem',
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>💰 分批策略</div>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{verdict.batchAdvice}</div>
                                                </div>
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    padding: '0.75rem',
                                                    borderRadius: '0.5rem',
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>🎯 進場點</div>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{verdict.entryAdvice}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Technical Data Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '1rem',
                                marginTop: '1.5rem',
                            }}>
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Weekly MACD</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.macd_weekly_trend === 'UP' ? '#ef4444' : quote.macd_weekly_trend === 'DOWN' ? '#10b981' : '#94a3b8' }}>
                                        {quote.macd_weekly_trend === "UP" ? "↑ UP" : quote.macd_weekly_trend === "DOWN" ? "↓ DOWN" : "→ FLAT"}
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Daily MACD Days</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.macd_histogram_days > 0 ? '#ef4444' : '#10b981' }}>
                                        {quote.macd_histogram_days > 0 ? `↑ +${quote.macd_histogram_days}` : `↓ ${quote.macd_histogram_days}`} Days
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>vs 5MA</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.price >= quote.ma5 ? '#ef4444' : '#10b981' }}>
                                        {quote.price >= quote.ma5 ? '↑' : '↓'} ${formatPrice(quote.ma5)}
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>vs 20MA (月線)</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.deviation_ma20 >= 0 ? '#ef4444' : '#10b981' }}>
                                        {quote.deviation_ma20 >= 0 ? '↑' : '↓'} {formatPercent(quote.deviation_ma20)}
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    gridColumn: 'span 2',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>vs 60MA (季線)</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.deviation_ma60 >= 0 ? '#ef4444' : '#10b981' }}>
                                        {quote.deviation_ma60 >= 0 ? '↑' : '↓'} {formatPercent(quote.deviation_ma60)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
