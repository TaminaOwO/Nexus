import { useState, useEffect, useCallback, useRef } from "react";
import {
    AlertTriangleIcon,
    CheckCircleIcon,
    RefreshIcon,
    PortfolioManagerIcon,
    PiggyBankIcon,
    ChartLineIcon,
    ChartCandlestickIcon,
    MailboxIcon,
    TrashIcon,
    DollarSignIcon,
    BookOpenIcon,
    XIcon,
} from "../../../components/Icons";
import { IconBOSS, IconCompany } from "../../../components/HandDrawnIcons";
import "./TradeJournal.css";

interface StrategySnapshot {
    ma20_deviation: number;
    ma60_deviation: number;
    macd_days: number;
    weekly_trend: string;
    current_price: number;
}

interface Holding {
    id: string;
    symbol: string;
    company_name: string;
    entry_price: number;
    quantity: number;
    planned_batches: number;
    current_batch: number;
    strategy: string;
    sub_strategy: string;
    cycle: string;
    stop_loss_price: number;
    take_profit_price: number;
    status: string;
    strategy_snapshot: StrategySnapshot;
    created_at: string;
    current_price: number;
    unrealized_pl: number;
    unrealized_pl_percent: number;
    cost_basis: number;
    market_value: number;
    days_held: number;
    strategy_alerts: string[];
}

interface Alert {
    type: string;
    symbol: string;
    trade_id: string;
    message: string;
}

interface PortfolioData {
    holdings: Holding[];
    alerts: Alert[];
    total_cost: number;
    market_value: number;
    total_pl: number;
    total_pl_percent: number;
}

const API_BASE = "/api/kite";

function formatPrice(price: number): string {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(value: number): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}

function formatMoney(value: number): string {
    const sign = value >= 0 ? "" : "-";
    const abs = Math.abs(value);
    if (abs >= 1000000) {
        return `${sign}$${(abs / 1000000).toFixed(2)}M`;
    }
    if (abs >= 1000) {
        return `${sign}$${(abs / 1000).toFixed(1)}K`;
    }
    return `${sign}$${abs.toFixed(0)}`;
}

export function TradeJournal() {
    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const dismissedAlertKeys = useRef<Set<string>>(new Set());

    // Settlement Modal State
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [settleTarget, setSettleTarget] = useState<Holding | null>(null);
    const [settleForm, setSettleForm] = useState({
        exitPrice: 0,
        exitNotes: "",
    });
    const [settling, setSettling] = useState(false);

    const fetchPortfolio = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/portfolio`);
            if (!response.ok) {
                throw new Error("Failed to fetch portfolio");
            }
            const data: PortfolioData = await response.json();
            setPortfolio(data);
            setLastRefresh(new Date());

            // Show alert modal only if there are NEW alerts not yet dismissed
            if (data.alerts && data.alerts.length > 0) {
                const hasNewAlert = data.alerts.some(
                    (a) => !dismissedAlertKeys.current.has(`${a.trade_id}:${a.symbol}:${a.type}`)
                );
                if (hasNewAlert) {
                    setShowAlertModal(true);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error loading portfolio");
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchPortfolio();
    }, [fetchPortfolio]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchPortfolio(true); // Silent refresh
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [autoRefresh, fetchPortfolio]);

    // Open settlement modal
    const openSettleModal = (holding: Holding) => {
        setSettleTarget(holding);
        setSettleForm({
            exitPrice: holding.current_price,
            exitNotes: "",
        });
        setShowSettleModal(true);
    };

    // Submit settlement
    const submitSettle = async () => {
        if (!settleTarget) return;
        setSettling(true);
        try {
            const response = await fetch(`${API_BASE}/trade/${settleTarget.id}/settle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exit_price: settleForm.exitPrice,
                    exit_notes: settleForm.exitNotes,
                }),
            });
            if (response.ok) {
                setShowSettleModal(false);
                fetchPortfolio();
            } else {
                throw new Error("Failed to settle trade");
            }
        } catch (err) {
            setError("Failed to settle trade");
        } finally {
            setSettling(false);
        }
    };

    // Calculate P&L preview
    const getSettlePLPreview = () => {
        if (!settleTarget) return { pl: 0, pct: 0 };
        const cost = settleTarget.entry_price * settleTarget.quantity;
        const exit = settleForm.exitPrice * settleTarget.quantity;
        const pl = exit - cost;
        const pct = cost > 0 ? (pl / cost) * 100 : 0;
        return { pl, pct };
    };

    // Delete trade
    const deleteTrade = async (holding: Holding) => {
        if (!window.confirm(`確認刪除 ${holding.company_name} (${holding.symbol}) 持股？\n\nConfirm delete this holding?`)) {
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/trade/${holding.id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                fetchPortfolio();
            } else {
                throw new Error("Failed to delete trade");
            }
        } catch (err) {
            setError("刪除失敗 Delete failed");
        }
    };

    if (loading) {
        return (
            <div className="trade-journal">
                <div className="loading">Loading portfolio...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="trade-journal">
                <div className="error-message"><AlertTriangleIcon size={16} /> {error}</div>
            </div>
        );
    }

    const plPreview = getSettlePLPreview();

    return (
        <div className="trade-journal">
            {/* Alert Modal */}
            {showAlertModal && portfolio?.alerts && portfolio.alerts.length > 0 && (
                <div className="alert-modal-overlay" onClick={() => setShowAlertModal(false)}>
                    <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="alert-modal-header">
                            <h3><AlertTriangleIcon size={20} /> Action Required!</h3>
                            <button className="modal-close" onClick={() => setShowAlertModal(false)}>
                                <XIcon size={20} />
                            </button>
                        </div>
                        <div className="alert-modal-body">
                            {portfolio.alerts.map((alert, idx) => (
                                <div key={idx} className={`alert-item ${alert.type.toLowerCase()}`}>
                                    {alert.message}
                                </div>
                            ))}
                        </div>
                        <div className="alert-modal-footer">
                            <button className="btn-ignore" onClick={() => {
                                portfolio?.alerts?.forEach((a) => dismissedAlertKeys.current.add(`${a.trade_id}:${a.symbol}:${a.type}`));
                                setShowAlertModal(false);
                            }}>
                                稍後處理 Ignore
                            </button>
                            <button className="btn-action" onClick={() => {
                                portfolio?.alerts?.forEach((a) => dismissedAlertKeys.current.add(`${a.trade_id}:${a.symbol}:${a.type}`));
                                setShowAlertModal(false);
                            }}>
                                我知道了 Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settlement Modal */}
            {showSettleModal && settleTarget && (
                <div className="settle-modal-overlay" onClick={() => setShowSettleModal(false)}>
                    <div className="settle-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><CheckCircleIcon size={20} /> 平倉結算 Settle Trade</h3>
                            <button className="modal-close" onClick={() => setShowSettleModal(false)}>
                                <XIcon size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="settle-stock-info">
                                <div className="settle-name">{settleTarget.company_name}</div>
                                <div className="settle-details">
                                    <span className="symbol">{settleTarget.symbol}</span>
                                    <span className={`strategy-tag ${settleTarget.strategy.toLowerCase()}`}>
                                        {settleTarget.strategy === "BOSS" ? <IconBOSS className="w-5 h-5 inline mr-1" /> : <IconCompany className="w-5 h-5 inline mr-1" />} {settleTarget.strategy}
                                    </span>
                                </div>
                            </div>

                            <div className="settle-summary">
                                <div className="settle-row">
                                    <span>進場價 Entry</span>
                                    <span>${formatPrice(settleTarget.entry_price)}</span>
                                </div>
                                <div className="settle-row">
                                    <span>股數 Shares</span>
                                    <span>{settleTarget.quantity.toLocaleString()}</span>
                                </div>
                                <div className="settle-row">
                                    <span>持有天數 Days Held</span>
                                    <span>{settleTarget.days_held} 天</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label><DollarSignIcon size={16} /> 出場價 Exit Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settleForm.exitPrice}
                                    onChange={(e) => setSettleForm({ ...settleForm, exitPrice: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className={`pl-preview ${plPreview.pl >= 0 ? "up" : "down"}`}>
                                <div className="pl-label">預估損益 Est. P&L</div>
                                <div className="pl-value">{formatMoney(plPreview.pl)}</div>
                                <div className="pl-pct">{formatPercent(plPreview.pct)}</div>
                            </div>

                            <div className="form-group">
                                <label><BookOpenIcon size={16} /> 備註 Notes</label>
                                <textarea
                                    rows={2}
                                    value={settleForm.exitNotes}
                                    onChange={(e) => setSettleForm({ ...settleForm, exitNotes: e.target.value })}
                                    placeholder="選填: 出場原因..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="settle-btn"
                                onClick={submitSettle}
                                disabled={settling || settleForm.exitPrice <= 0}
                            >
                                {settling ? "處理中..." : "確認平倉 Confirm Settle"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="journal-header">
                <h2><PortfolioManagerIcon size={24} style={{ display: 'inline-block', verticalAlign: 'text-top', marginRight: '2px' }} /> Portfolio Manager</h2>
                <div className="header-controls">
                    <div className="refresh-info">
                        <span className="last-update">
                            Last: {lastRefresh.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <label className="auto-refresh-toggle">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                            />
                            <span>Auto (30s)</span>
                        </label>
                    </div>
                    <button className="refresh-btn" onClick={() => fetchPortfolio()}>
                        <RefreshIcon size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {portfolio && (
                <div className="summary-cards">
                    <div className="summary-card">
                        <span className="label"><PiggyBankIcon size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Total Cost</span>
                        <span className="value">{formatMoney(portfolio.total_cost)}</span>
                    </div>
                    <div className="summary-card">
                        <span className="label"><ChartLineIcon size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Market Value</span>
                        <span className="value">{formatMoney(portfolio.market_value)}</span>
                    </div>
                    <div className={`summary-card pl ${portfolio.total_pl >= 0 ? "up" : "down"}`}>
                        <span className="label"><ChartCandlestickIcon size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Total P/L</span>
                        <span className="value">
                            {formatMoney(portfolio.total_pl)}
                            <span className="pct">{formatPercent(portfolio.total_pl_percent)}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Holdings */}
            {portfolio && portfolio.holdings && portfolio.holdings.length > 0 ? (
                <div className="holdings-list">
                    {portfolio.holdings.map((holding) => (
                        <div
                            key={holding.id}
                            className={`holding-card ${holding.strategy.toLowerCase()}`}
                        >
                            <div className="holding-header">
                                <div className="holding-name">
                                    <span className="company">{holding.company_name}</span>
                                    <span className="symbol">{holding.symbol}</span>
                                </div>
                                <div className={`holding-pl ${holding.unrealized_pl >= 0 ? "up" : "down"}`}>
                                    <span className="pl-amount">{formatMoney(holding.unrealized_pl)}</span>
                                    <span className="pl-pct">{formatPercent(holding.unrealized_pl_percent)}</span>
                                </div>
                            </div>

                            <div className="holding-details">
                                <div className="detail-row">
                                    <span className="strategy-badge">
                                        {holding.strategy === "BOSS" ? <IconBOSS className="w-4 h-4 inline mr-1" /> : <IconCompany className="w-4 h-4 inline mr-1" />}
                                        {holding.strategy} - {holding.sub_strategy.replace(/_/g, " ")}
                                    </span>
                                    <span className="days-held">{holding.days_held}天</span>
                                </div>
                                <div className="price-row">
                                    <span>入 ${formatPrice(holding.entry_price)}</span>
                                    <span>→</span>
                                    <span>現 ${formatPrice(holding.current_price)}</span>
                                </div>
                            </div>

                            {/* Strategy Alerts */}
                            {holding.strategy_alerts && holding.strategy_alerts.length > 0 && (
                                <div className="holding-alerts">
                                    {holding.strategy_alerts.map((alert, idx) => (
                                        <div key={idx} className="holding-alert-tag">
                                            {alert}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="holding-action">
                                <button
                                    className="settle-action-btn"
                                    onClick={() => openSettleModal(holding)}
                                >
                                    <CheckCircleIcon size={16} /> 平倉 Settle
                                </button>
                                <button
                                    className="delete-action-btn"
                                    onClick={() => deleteTrade(holding)}
                                    title="刪除 Delete"
                                >
                                    <TrashIcon size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p><MailboxIcon size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> No open positions</p>
                    <p className="hint">Use Stock Inspector to record new trades</p>
                </div>
            )}
        </div>
    );
}
