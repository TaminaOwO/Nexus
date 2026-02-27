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
import { IconCompany, IconBOSS } from "../../../components/HandDrawnIcons";
import { StockInspectorIcon, CheckboxIcon, SearchIcon, BookOpenIcon, TrendingUpIcon, LoaderIcon, DollarSignIcon, TagIcon, StrongWeekIcon, WeeklyPullbackIcon, WeeklyTrendIcon, TargetIcon, StopCircleIcon, CheckCircleIcon, AlertTriangleIcon, XCircleIcon, SpellCheckIcon, SaveIcon, BellRingIcon, TrendingDownIcon, CycleIcon } from "../../../components/Icons";
import { StrategyChecklist } from "./StrategyChecklist";
import { StockChart } from "./StockChart";
import { MACD_STATUS_COLORS, MacdTrendStatus } from "../utils/macdUtils";
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
                <div className="si-modal-overlay" onClick={() => setShowTradeModal(false)}>
                    <div className="si-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="si-modal-header">
                            <h3>
                                <BookOpenIcon size={20} /> 記錄交易 Log Trade
                            </h3>
                            <button className="si-modal-close" onClick={() => setShowTradeModal(false)} style={{ color: '#374151', fontSize: '1.25rem', lineHeight: 1 }}>
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="si-modal-body">
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
                                <div className="auto-captured-title"><SpellCheckIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> 自動擷取 Auto-Captured</div>
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
                        <div className="si-modal-footer">
                            {tradeSuccess ? (
                                <div className="si-modal-success"><CheckCircleIcon size={18} /> 交易已記錄!</div>
                            ) : (
                                <button
                                    className="si-modal-save-btn"
                                    onClick={saveTrade}
                                    disabled={tradeSaving || tradeForm.entryPrice <= 0}
                                >
                                    {tradeSaving ? "保存中..." : <><SaveIcon size={16} /> 儲存交易 Save Trade</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="inspector-header">
                <h2><StockInspectorIcon size={20} style={{ display: 'inline-block', verticalAlign: 'text-top', marginRight: '2px' }} /> Stock Inspector</h2>
                <span className="cycle-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {structure === 'EASY_RISE' ? <TrendingUpIcon size={14} /> : structure === 'EASY_FALL' ? <TrendingDownIcon size={14} /> : <CycleIcon size={14} />} {structureInfo.zh}
                </span>
            </div>

            {/* Layer 1: Strategy Tabs */}
            <div className="strategy-tabs">
                <button
                    className={`strategy-tab ${activeStrategy === "OFFICE" ? "active office" : ""}`}
                    onClick={() => setActiveStrategy("OFFICE")}
                >
                    <IconCompany className="w-8 h-8" />
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>OFFICE</span>
                </button>
                <button
                    className={`strategy-tab ${activeStrategy === "BOSS" ? "active boss" : ""}`}
                    onClick={() => setActiveStrategy("BOSS")}
                >
                    <IconBOSS className="w-8 h-8" />
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>BOSS</span>
                </button>
            </div>

            {/* Layer 2: Sub-Strategy Pills */}
            <div className="si-sub-pills">
                {activeStrategy === "OFFICE" ? (
                    <>
                        <button
                            className={`si-sub-pill ${officeSubStrategy === "STRONG_WEEKLY" ? "active office" : ""}`}
                            onClick={() => setOfficeSubStrategy("STRONG_WEEKLY")}
                        >
                            <StrongWeekIcon size={14} /> 強勢週
                        </button>
                        <button
                            className={`si-sub-pill ${officeSubStrategy === "WEEKLY_TREND" ? "active office" : ""}`}
                            onClick={() => setOfficeSubStrategy("WEEKLY_TREND")}
                        >
                            <WeeklyTrendIcon size={14} /> 週趨勢
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className={`si-sub-pill ${bossSubStrategy === "WEEKLY_PULLBACK" ? "active boss" : ""}`}
                            onClick={() => setBossSubStrategy("WEEKLY_PULLBACK")}
                        >
                            <WeeklyPullbackIcon size={14} /> 週拉回
                        </button>
                        <button
                            className={`si-sub-pill ${bossSubStrategy === "CHEAP_ACQUISITION" ? "active boss" : ""}`}
                            onClick={() => setBossSubStrategy("CHEAP_ACQUISITION")}
                        >
                            <TagIcon size={14} /> 廉價收購
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
                    <div className="search-bar">
                        <input
                            type="text"
                            className="si-search-input"
                            placeholder="Enter symbol (e.g., 2330, 4979)"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
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
                                    <div className="si-price-card-name">
                                        {quote.company_name} ({quote.symbol})
                                    </div>
                                    <div className="si-price-card-price">
                                        ${formatPrice(quote.price)}
                                    </div>
                                    <div className={`si-price-card-change ${quote.change_percent >= 0 ? 'up' : 'down'}`}>
                                        {quote.change_percent >= 0 ? '↑' : '↓'} {formatPercent(quote.change_percent)}
                                    </div>
                                </div>

                                {/* Trade Value Card */}
                                <div className="info-card">
                                    <div className="si-trade-value-label">
                                        Trade Value
                                    </div>
                                    <div className="si-trade-value-number">
                                        {formatTradeValue(quote.trade_value)}
                                    </div>
                                    {isHot && (
                                        <div className="hot-badge">
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
                                        <div className="si-check-title">
                                            營收爆發檢查 (YOY &gt; 30%)
                                        </div>
                                        <div className="si-check-subtitle">
                                            Confirm single-month revenue growth is strong
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Verdict Alert Card */}
                            {verdict && (
                                <div className={`si-verdict-card ${verdict.status === 'BUY' ? 'buy' : verdict.status === 'WAIT' ? 'wait' : 'danger'}`}>
                                    {/* Icon */}
                                    <div className="si-verdict-icon">
                                        {verdict.status === 'BUY' ? <CheckCircleIcon size={48} /> : verdict.status === 'WAIT' ? <AlertTriangleIcon size={48} /> : <XCircleIcon size={48} />}
                                    </div>
                                    {/* Content */}
                                    <div className="si-verdict-content">
                                        <div className={`si-verdict-title ${verdict.status === 'BUY' ? 'buy' : verdict.status === 'WAIT' ? 'wait' : 'danger'}`}>
                                            {verdict.status === 'BUY' ? 'Buy Signal - 可進場'
                                                : verdict.status === 'WAIT' ? 'Caution - 觀察中'
                                                    : 'Stop - 不建議'}
                                        </div>
                                        <div className="si-verdict-message">
                                            {verdict.message}
                                        </div>
                                        {quote.macd_trend_status === 'WEAKENING_BULL' && (
                                            <div style={{ fontSize: '0.88rem', color: '#9A3412', fontWeight: 600, marginTop: '4px' }}>
                                                動能衰退中：日 MACD 紅柱連續縮短，不宜追漲。
                                            </div>
                                        )}
                                        {verdict.timeWarning && (
                                            <div className="si-verdict-time-warning">
                                                <BellRingIcon size={14} /> {verdict.timeWarning}
                                            </div>
                                        )}
                                        {/* Operational Guide (Boss only) */}
                                        {verdict.batchAdvice && verdict.entryAdvice && (
                                            <div className="verdict-advice-grid">
                                                <div className="verdict-advice-item">
                                                    <div className="verdict-advice-label"><DollarSignIcon size={12} /> 分批策略</div>
                                                    <div className="verdict-advice-value">{verdict.batchAdvice}</div>
                                                </div>
                                                <div className="verdict-advice-item">
                                                    <div className="verdict-advice-label"><TargetIcon size={12} /> 進場點</div>
                                                    <div className="verdict-advice-value">{verdict.entryAdvice}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Technical Data Grid */}
                            <div className="technical-grid">
                                <div className="tech-card">
                                    <div className="tech-label">Weekly MACD</div>
                                    <div className={`tech-value ${quote.macd_weekly_trend === 'UP' ? 'macd-up' : quote.macd_weekly_trend === 'DOWN' ? 'macd-down' : 'macd-flat'}`}>
                                        {quote.macd_weekly_trend === "UP" ? "↑ UP" : quote.macd_weekly_trend === "DOWN" ? "↓ DOWN" : "→ FLAT"}
                                    </div>
                                </div>
                                <div className="tech-card">
                                    <div className="tech-label">Daily MACD Days</div>
                                    <div className={`tech-value ${quote.macd_histogram_days > 0 ? 'macd-up' : 'macd-down'}`}
                                        style={quote.macd_trend_status ? { color: MACD_STATUS_COLORS[quote.macd_trend_status as MacdTrendStatus] } : undefined}>
                                        {quote.macd_histogram_days > 0 ? `↑ +${quote.macd_histogram_days}` : `↓ ${quote.macd_histogram_days}`} Days
                                    </div>
                                    {quote.macd_trend_status && (
                                        <div style={{ fontSize: '0.78rem', marginTop: '2px', color: MACD_STATUS_COLORS[quote.macd_trend_status as MacdTrendStatus], fontWeight: 600 }}>
                                            {quote.macd_trend_status === 'STRONG_BULL' && '▲ 動能強勁'}
                                            {quote.macd_trend_status === 'WEAKENING_BULL' && '▼ 動能衰退'}
                                            {quote.macd_trend_status === 'STRONG_BEAR' && '▼ 跌勢擴張'}
                                            {quote.macd_trend_status === 'WEAKENING_BEAR' && '▲ 跌勢收斂'}
                                        </div>
                                    )}
                                </div>
                                <div className="tech-card">
                                    <div className="tech-label">vs 5MA</div>
                                    <div className={`tech-value ${quote.price >= quote.ma5 ? 'macd-up' : 'macd-down'}`}>
                                        {quote.price >= quote.ma5 ? '↑' : '↓'} ${formatPrice(quote.ma5)}
                                    </div>
                                </div>
                                <div className="tech-card">
                                    <div className="tech-label">vs 20MA (月線)</div>
                                    <div className={`tech-value ${quote.deviation_ma20 >= 0 ? 'macd-up' : 'macd-down'}`}>
                                        {quote.deviation_ma20 >= 0 ? '↑' : '↓'} {formatPercent(quote.deviation_ma20)}
                                    </div>
                                </div>
                                <div className="tech-card span-2">
                                    <div className="tech-label">vs 60MA (季線)</div>
                                    <div className={`tech-value ${quote.deviation_ma60 >= 0 ? 'macd-up' : 'macd-down'}`}>
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
                                macdTrendStatus={quote.macd_trend_status as MacdTrendStatus || null}
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
