import { useState, useCallback, useMemo, useEffect } from "react";
import {
    QuoteData,
    StrategyType,
    GateLight,
    StructureType,
    STRUCTURE_LABELS,
    SubStrategyType,
    OfficeSubStrategy,
    BossSubStrategy,
    WindType,
} from "../types";
import { getStrategyVerdict } from "../utils/strategyDiagnosis";
import { IconCompany, IconBOSS, IconLifeOS } from "../../../components/HandDrawnIcons";
import { CheckboxIcon, SearchIcon, BookOpenIcon, TrendingUpIcon, LoaderIcon, DollarSignIcon, TagIcon, TargetIcon, StopCircleIcon, CheckCircleIcon, AlertTriangleIcon, XCircleIcon } from "../../../components/Icons";
import { StrategyChecklist } from "./StrategyChecklist";
import { StockChart } from "./StockChart";
import "./StockInspector.css";

interface WatchlistConversionData {
    symbol: string;
    companyName: string;
    targetPrice: number;
    strategy: "OFFICE" | "BOSS";
    subStrategy: SubStrategyType;
}

interface StockInspectorProps {
    gateLight: GateLight;
    strategy: StrategyType;
    structure: StructureType;
    initialSymbol?: string;
    currentWind?: WindType | null;
    conversionData?: WatchlistConversionData | null;
    onConversionComplete?: () => void;
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

export function StockInspector({ gateLight, strategy: defaultStrategy, structure, initialSymbol, currentWind, conversionData, onConversionComplete }: StockInspectorProps) {
    // ============ State ============
    const [symbol, setSymbol] = useState(initialSymbol || "");
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

    // Chart modal state
    const [showChart, setShowChart] = useState(false);

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

    // Handle watchlist conversion - auto-fetch quote and open trade modal
    useEffect(() => {
        if (conversionData) {
            // Set symbol and strategy from conversion data
            setSymbol(conversionData.symbol);
            setActiveStrategy(conversionData.strategy);

            if (conversionData.strategy === "OFFICE") {
                setOfficeSubStrategy(conversionData.subStrategy as OfficeSubStrategy);
            } else {
                setBossSubStrategy(conversionData.subStrategy as BossSubStrategy);
            }

            // Auto-fetch quote
            const autoFetch = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${API_BASE}/quote?symbol=${encodeURIComponent(conversionData.symbol)}`);
                    if (!response.ok) {
                        throw new Error("Failed to fetch quote");
                    }
                    const data: QuoteData = await response.json();
                    setQuote(data);

                    // Auto-open trade modal after quote loads
                    const defaultStopLoss = Math.round(data.price * 0.95 * 100) / 100;
                    setTradeForm({
                        entryPrice: data.price,
                        quantity: 1000, // Default to 1張 = 1000股
                        plannedBatches: structure === "EASY_RISE" ? 3 : structure === "BOUNDARY" ? 5 : 10,
                        currentBatch: 1,
                        stopLossPrice: defaultStopLoss,
                        takeProfitPrice: conversionData.targetPrice || 0,
                    });
                    setTradeSuccess(false);
                    setShowTradeModal(true);
                } catch (err) {
                    setError("Failed to load stock data for conversion");
                } finally {
                    setLoading(false);
                }
            };

            autoFetch();
        }
    }, [conversionData, structure]);

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

            // If this was a watchlist conversion, notify parent
            if (conversionData && onConversionComplete) {
                onConversionComplete();
            }

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
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                }} onClick={() => setShowTradeModal(false)}>
                    <div style={{
                        background: '#FFFFFF',
                        border: '1px solid #DEE2E6',
                        borderRadius: '1rem',
                        width: '100%',
                        maxWidth: '520px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid #DEE2E6',
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BookOpenIcon size={20} /> 記錄交易 Log Trade
                            </h3>
                            <button
                                onClick={() => setShowTradeModal(false)}
                                style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#F7F8FA',
                                    border: 'none',
                                    borderRadius: '50%',
                                    color: '#64748B',
                                    fontSize: '1.25rem',
                                    cursor: 'pointer',
                                }}
                            >×</button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Strategy Badge */}
                            <div className="trade-form-strategy">
                                <span className="strategy-icon">
                                    {activeStrategy === "BOSS" ? <IconBOSS className="w-8 h-8" /> : <IconCompany className="w-8 h-8" />}
                                </span>
                                <div className="strategy-info">
                                    <div className="strategy-name">{activeStrategy} Strategy</div>
                                    <div className="strategy-sub">{currentSubStrategy.replace(/_/g, " ")}</div>
                                </div>
                            </div>

                            {/* Stock Info */}
                            <div className="trade-form-stock">
                                <span className="stock-name">{quote.company_name}</span>
                                <span className="stock-symbol">{quote.symbol}</span>
                            </div>

                            {/* Price & Shares Row */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label><DollarSignIcon size={14} /> 價格 Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tradeForm.entryPrice}
                                        onChange={(e) => setTradeForm({ ...tradeForm, entryPrice: parseFloat(e.target.value) || 0 })}
                                        className="form-input mono"
                                    />
                                    <span className="form-hint">系統價: ${formatPrice(quote.price)}</span>
                                </div>
                                <div className="form-group">
                                    <label><TagIcon size={14} /> 股數 Shares</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1000"
                                        value={tradeForm.quantity}
                                        onChange={(e) => setTradeForm({ ...tradeForm, quantity: parseInt(e.target.value) || 1000 })}
                                        className="form-input mono"
                                    />
                                    <span className="form-hint">1張 = 1000股</span>
                                </div>
                            </div>

                            {/* Batches Row */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label><DollarSignIcon size={14} /> 預計分批 Batches</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={tradeForm.plannedBatches}
                                        onChange={(e) => setTradeForm({ ...tradeForm, plannedBatches: parseInt(e.target.value) || 1 })}
                                        className="form-input mono"
                                    />
                                    <span className="form-hint">建議: {getSuggestedBatches()}</span>
                                </div>
                                <div className="form-group">
                                    <label><TargetIcon size={14} /> 第幾批 Current</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={tradeForm.plannedBatches}
                                        value={tradeForm.currentBatch}
                                        onChange={(e) => setTradeForm({ ...tradeForm, currentBatch: parseInt(e.target.value) || 1 })}
                                        className="form-input mono"
                                    />
                                </div>
                            </div>

                            {/* Exit Plan */}
                            <div className="exit-plan-card">
                                <div className="exit-plan-title"><StopCircleIcon size={16} /> 出場計畫 Exit Plan</div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>停損價 Stop Loss *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={tradeForm.stopLossPrice}
                                            onChange={(e) => setTradeForm({ ...tradeForm, stopLossPrice: parseFloat(e.target.value) || 0 })}
                                            className={`form-input mono ${tradeForm.stopLossPrice <= 0 ? 'error' : ''}`}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>停利價 Take Profit</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={tradeForm.takeProfitPrice || ""}
                                            onChange={(e) => setTradeForm({ ...tradeForm, takeProfitPrice: parseFloat(e.target.value) || 0 })}
                                            placeholder="選填"
                                            className="form-input mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Auto-captured Context */}
                            <div className="auto-captured">
                                <div className="auto-captured-title">📊 自動擷取 Auto-Captured</div>
                                <div className="auto-captured-grid">
                                    <div className="captured-item">
                                        <div className="captured-label">Strategy</div>
                                        <div className="captured-value">
                                            {activeStrategy === "BOSS" ? <IconBOSS className="w-5 h-5" /> : <IconCompany className="w-5 h-5" />}
                                        </div>
                                    </div>
                                    <div className="captured-item">
                                        <div className="captured-label">Cycle</div>
                                        <div className="captured-value">{structureInfo.zh}</div>
                                    </div>
                                    <div className="captured-item">
                                        <div className="captured-label">MA20 Dev</div>
                                        <div className={`captured-value ${quote.deviation_ma20 >= 0 ? 'up' : 'down'}`}>
                                            {formatPercent(quote.deviation_ma20)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderTop: '1px solid #DEE2E6',
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
                                }}><CheckCircleIcon size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> 交易已記錄!</div>
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
            <div className="strategy-tabs">
                <button
                    className={`strategy-tab ${activeStrategy === "OFFICE" ? "active office" : ""}`}
                    onClick={() => setActiveStrategy("OFFICE")}
                >
                    <IconCompany className="w-8 h-8" />
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>OFFICE 策略</span>
                </button>
                <button
                    className={`strategy-tab ${activeStrategy === "BOSS" ? "active boss" : ""}`}
                    onClick={() => setActiveStrategy("BOSS")}
                >
                    <IconBOSS className="w-8 h-8" />
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>BOSS 策略</span>
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
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: officeSubStrategy === "STRONG_WEEKLY"
                                    ? '#DBEAFE'
                                    : 'transparent',
                                border: officeSubStrategy === "STRONG_WEEKLY"
                                    ? '2px solid #3B82F6'
                                    : '1px solid #DEE2E6',
                                borderRadius: '9999px',
                                color: officeSubStrategy === "STRONG_WEEKLY" ? '#3B82F6' : '#64748B',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <IconLifeOS className="w-4 h-4" /> 強勢週/追漲
                        </button>
                        <button
                            onClick={() => setOfficeSubStrategy("WEEKLY_TREND")}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: officeSubStrategy === "WEEKLY_TREND"
                                    ? '#DBEAFE'
                                    : 'transparent',
                                border: officeSubStrategy === "WEEKLY_TREND"
                                    ? '2px solid #3B82F6'
                                    : '1px solid #DEE2E6',
                                borderRadius: '9999px',
                                color: officeSubStrategy === "WEEKLY_TREND" ? '#3B82F6' : '#64748B',
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
                                    ? '#FEF3C7'
                                    : 'transparent',
                                border: bossSubStrategy === "WEEKLY_PULLBACK"
                                    ? '2px solid #f59e0b'
                                    : '1px solid #DEE2E6',
                                borderRadius: '9999px',
                                color: bossSubStrategy === "WEEKLY_PULLBACK" ? '#D97706' : '#64748B',
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
                                    ? '#FEF3C7'
                                    : 'transparent',
                                border: bossSubStrategy === "CHEAP_ACQUISITION"
                                    ? '2px solid #f59e0b'
                                    : '1px solid #DEE2E6',
                                borderRadius: '9999px',
                                color: bossSubStrategy === "CHEAP_ACQUISITION" ? '#D97706' : '#64748B',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <TagIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> 廉價收購
                        </button>
                    </>
                )}
            </div>

            {isDisabled ? (
                <div className="inspector-disabled">
                    <p><StopCircleIcon size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Gate is STOP - Office Worker Strategy Disabled</p>
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
                                background: '#FFFFFF',
                                border: '2px solid #DEE2E6',
                                borderRadius: '0.75rem',
                                color: '#0F172A',
                                fontSize: '1.25rem',
                                outline: 'none',
                            }}
                        />
                        <button
                            className="search-btn"
                            onClick={fetchQuote}
                            disabled={loading || !symbol.trim()}
                            aria-label="搜尋股票"
                            style={{
                                background: activeStrategy === "BOSS" ? '#f59e0b' : '#3B82F6',
                                opacity: loading || !symbol.trim() ? 0.5 : 1,
                            }}
                        >
                            {loading ? <LoaderIcon size={20} /> : <SearchIcon size={20} />}
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="error-message">
                            <AlertTriangleIcon size={16} /> {error}
                        </div>
                    )}

                    {/* Quote Display */}
                    {quote && (
                        <div className="quote-card">
                            {/* Stock Info Header - 2 Column Grid */}
                            <div className="info-cards-grid">
                                {/* Price Card */}
                                <div className="info-card">
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        {quote.company_name} ({quote.symbol})
                                    </div>
                                    <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                                        ${formatPrice(quote.price)}
                                    </div>
                                    <div style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 700,
                                        marginTop: '0.25rem',
                                        color: quote.change_percent >= 0 ? 'var(--danger)' : 'var(--success)',
                                    }}>
                                        {quote.change_percent >= 0 ? '↑' : '↓'} {formatPercent(quote.change_percent)}
                                    </div>
                                </div>

                                {/* Trade Value Card */}
                                <div className="info-card">
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                                        Trade Value
                                    </div>
                                    <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fbbf24' }}>
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
                                            Hot
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                <button className="action-btn record" onClick={openTradeModal}>
                                    <BookOpenIcon size={18} /> 記錄進場
                                </button>
                                <button className="action-btn chart" onClick={() => setShowChart(true)}>
                                    <TrendingUpIcon size={18} /> K線圖
                                </button>
                            </div>

                            {/* Boss: Revenue YOY Verification Tile */}
                            {activeStrategy === "BOSS" && (
                                <div
                                    className="validation-check"
                                    onClick={() => setRevenueYoyChecked(!revenueYoyChecked)}
                                    onKeyDown={(e) => {
                                        if (e.key === ' ' || e.key === 'Enter') {
                                            e.preventDefault();
                                            setRevenueYoyChecked(!revenueYoyChecked);
                                        }
                                    }}
                                    role="checkbox"
                                    aria-checked={revenueYoyChecked}
                                    tabIndex={0}
                                >
                                    <CheckboxIcon checked={revenueYoyChecked} size={28} />
                                    <div>
                                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            營收爆發檢查 (YOY &gt; 30%)
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
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
                                        {verdict.status === 'BUY' ? <CheckCircleIcon size={48} /> : verdict.status === 'WAIT' ? <AlertTriangleIcon size={48} /> : <XCircleIcon size={48} />}
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
                                            {verdict.status === 'BUY' ? 'Buy Signal - 可進場'
                                                : verdict.status === 'WAIT' ? 'Caution - 觀察中'
                                                    : 'Stop - 不建議'}
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
                                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}><DollarSignIcon size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> 分批策略</div>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{verdict.batchAdvice}</div>
                                                </div>
                                                <div style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    padding: '0.75rem',
                                                    borderRadius: '0.5rem',
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}><TargetIcon size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> 進場點</div>
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
                                    background: '#F7F8FA',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #DEE2E6',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Weekly MACD</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.macd_weekly_trend === 'UP' ? '#ef4444' : quote.macd_weekly_trend === 'DOWN' ? '#10b981' : '#64748B' }}>
                                        {quote.macd_weekly_trend === "UP" ? "↑ UP" : quote.macd_weekly_trend === "DOWN" ? "↓ DOWN" : "→ FLAT"}
                                    </div>
                                </div>
                                <div style={{
                                    background: '#F7F8FA',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #DEE2E6',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Daily MACD Days</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.macd_histogram_days > 0 ? '#ef4444' : '#10b981' }}>
                                        {quote.macd_histogram_days > 0 ? `↑ +${quote.macd_histogram_days}` : `↓ ${quote.macd_histogram_days}`} Days
                                    </div>
                                </div>
                                <div style={{
                                    background: '#F7F8FA',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #DEE2E6',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>vs 5MA</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.price >= quote.ma5 ? '#ef4444' : '#10b981' }}>
                                        {quote.price >= quote.ma5 ? '↑' : '↓'} ${formatPrice(quote.ma5)}
                                    </div>
                                </div>
                                <div style={{
                                    background: '#F7F8FA',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #DEE2E6',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>vs 20MA (月線)</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.deviation_ma20 >= 0 ? '#ef4444' : '#10b981' }}>
                                        {quote.deviation_ma20 >= 0 ? '↑' : '↓'} {formatPercent(quote.deviation_ma20)}
                                    </div>
                                </div>
                                <div style={{
                                    background: '#F7F8FA',
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #DEE2E6',
                                    gridColumn: 'span 2',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>vs 60MA (季線)</div>
                                    <div style={{ fontSize: '1.125rem', fontFamily: 'monospace', fontWeight: 700, color: quote.deviation_ma60 >= 0 ? '#ef4444' : '#10b981' }}>
                                        {quote.deviation_ma60 >= 0 ? '↑' : '↓'} {formatPercent(quote.deviation_ma60)}
                                    </div>
                                </div>
                            </div>

                            {/* Strategy Conditions Checklist */}
                            <StrategyChecklist
                                quote={quote}
                                structure={structure}
                                subStrategy={currentSubStrategy}
                                currentWind={currentWind ?? null}
                                revenueYoyChecked={revenueYoyChecked}
                            />
                        </div>
                    )}
                </>
            )}

            {/* K-Line Chart Modal */}
            {showChart && quote && (
                <StockChart
                    symbol={quote.symbol}
                    quote={quote}
                    structure={structure}
                    currentSubStrategy={currentSubStrategy}
                    currentWind={currentWind}
                    revenueYoyChecked={revenueYoyChecked}
                    onClose={() => setShowChart(false)}
                />
            )}
        </div>
    );
}
