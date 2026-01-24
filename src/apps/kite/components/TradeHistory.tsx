import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { IconBOSS, IconCompany } from "../../../components/HandDrawnIcons";
import { AlertTriangleIcon } from "../../../components/Icons";
import "./TradeHistory.css";

interface ClosedTrade {
    id: string;
    symbol: string;
    company_name: string;
    entry_price: number;
    exit_price: number;
    quantity: number;
    strategy: string;
    sub_strategy: string;
    final_pl: number;
    final_pl_percent: number;
    created_at: string;
    closed_at: string;
    exit_notes: string;
}

interface HistoryData {
    trades: ClosedTrade[];
    total_pl: number;
    win_rate: number;
    total_trades: number;
    wins: number;
    best_strategy: string;
    best_pl: number;
}

const API_BASE = "/api/kite";

const STRATEGY_OPTIONS = [
    { value: "OFFICE|STRONG_WEEKLY", label: "Office - Strong Weekly", icon: "OFFICE" },
    { value: "OFFICE|WEEKLY_TREND", label: "Office - Weekly Trend", icon: "OFFICE" },
    { value: "BOSS|WEEKLY_PULLBACK", label: "Boss - Weekly Pullback", icon: "BOSS" },
    { value: "BOSS|CHEAP_ACQUISITION", label: "Boss - Cheap Acquisition", icon: "BOSS" },
];

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

function formatDate(dateStr: string): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-TW", { month: "short", day: "numeric" });
}

function calcDays(entryStr: string, exitStr: string): number {
    const entry = new Date(entryStr);
    const exit = new Date(exitStr);
    return Math.ceil((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
}

// Calculate strategy-specific performance
function getStrategyStats(trades: ClosedTrade[]) {
    const stats: Record<string, { wins: number; total: number; pl: number }> = {};

    trades.forEach(trade => {
        const key = `${trade.strategy}|${trade.sub_strategy}`;
        if (!stats[key]) {
            stats[key] = { wins: 0, total: 0, pl: 0 };
        }
        stats[key].total++;
        stats[key].pl += trade.final_pl;
        if (trade.final_pl > 0) stats[key].wins++;
    });

    return Object.entries(stats).map(([key, data]) => {
        const [strategy, subStrategy] = key.split('|');
        return {
            strategy,
            subStrategy,
            winRate: (data.wins / data.total) * 100,
            totalPL: data.pl,
            totalTrades: data.total,
        };
    }).sort((a, b) => b.totalPL - a.totalPL);
}

// Calculate monthly performance
function getMonthlyStats(trades: ClosedTrade[]) {
    const monthly: Record<string, { pl: number; trades: number }> = {};

    trades.forEach(trade => {
        const date = new Date(trade.closed_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[key]) {
            monthly[key] = { pl: 0, trades: 0 };
        }
        monthly[key].pl += trade.final_pl;
        monthly[key].trades++;
    });

    return Object.entries(monthly)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

export function TradeHistory() {
    const [history, setHistory] = useState<HistoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Import Modal
    const [showImport, setShowImport] = useState(false);
    const [importForm, setImportForm] = useState({
        symbol: "",
        companyName: "",
        strategy: "BOSS|WEEKLY_PULLBACK",
        entryPrice: 0,
        exitPrice: 0,
        quantity: 1,
        entryDate: "",
        exitDate: "",
        notes: "",
    });
    const [importing, setImporting] = useState(false);
    const [fetchingName, setFetchingName] = useState(false);
    const [nameEditable, setNameEditable] = useState(false);
    const [isActiveHolding, setIsActiveHolding] = useState(false); // Toggle for active vs closed import

    // Auto-fetch company name from quote API
    const fetchCompanyName = async (symbol: string) => {
        if (!symbol.trim()) return;
        setFetchingName(true);
        try {
            const response = await fetch(`${API_BASE}/quote?symbol=${symbol.toUpperCase()}`);
            if (response.ok) {
                const data = await response.json();
                if (data.company_name) {
                    setImportForm(prev => ({ ...prev, companyName: data.company_name }));
                }
            }
        } catch {
            // Fallback: allow manual entry
        } finally {
            setFetchingName(false);
        }
    };

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/history`);
            if (!response.ok) throw new Error("Failed to fetch history");
            const data: HistoryData = await response.json();
            setHistory(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error loading history");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const submitImport = async () => {
        setImporting(true);
        try {
            const [strategy, subStrategy] = importForm.strategy.split("|");
            const response = await fetch(`${API_BASE}/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    symbol: importForm.symbol.toUpperCase(),
                    company_name: importForm.companyName || importForm.symbol.toUpperCase(),
                    strategy: strategy,
                    sub_strategy: subStrategy,
                    entry_price: importForm.entryPrice,
                    exit_price: importForm.exitPrice,
                    quantity: importForm.quantity,
                    entry_date: importForm.entryDate,
                    exit_date: importForm.exitDate,
                    notes: importForm.notes,
                }),
            });
            if (response.ok) {
                setShowImport(false);
                setImportForm({
                    symbol: "",
                    companyName: "",
                    strategy: "BOSS|WEEKLY_PULLBACK",
                    entryPrice: 0,
                    exitPrice: 0,
                    quantity: 1,
                    entryDate: "",
                    exitDate: "",
                    notes: "",
                });
                fetchHistory();
            } else {
                throw new Error("Import failed");
            }
        } catch (err) {
            setError("Failed to import trade");
        } finally {
            setImporting(false);
        }
    };

    if (loading) {
        return <div className="trade-history"><div className="loading">Loading history...</div></div>;
    }

    return (
        <div className="trade-history">
            {/* Import Modal - Using Portal to render to document.body */}
            {showImport && createPortal(
                <div
                    onClick={() => setShowImport(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '1rem',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        className="import-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            border: '1px solid #DEE2E6',
                            borderRadius: '1rem',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                            width: '95vw',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid #DEE2E6',
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>➕ 匯入歷史交易 Import Past Trade</h3>
                            <button
                                onClick={() => setShowImport(false)}
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
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>📊 股票代碼 Symbol</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2330"
                                        value={importForm.symbol}
                                        onChange={(e) => setImportForm({ ...importForm, symbol: e.target.value })}
                                        onBlur={(e) => fetchCompanyName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                                    <label>
                                        🏢 公司名 Company
                                        {!nameEditable && importForm.companyName && (
                                            <button
                                                className="edit-btn"
                                                onClick={() => setNameEditable(true)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={fetchingName ? "Loading..." : "自動帶入 Auto-fill"}
                                        value={importForm.companyName}
                                        onChange={(e) => setImportForm({ ...importForm, companyName: e.target.value })}
                                        readOnly={!nameEditable && !!importForm.companyName}
                                        className={fetchingName ? "loading" : ""}
                                        style={{ width: '100%', maxWidth: '100%' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>🎯 策略 Strategy</label>
                                <select
                                    value={importForm.strategy}
                                    onChange={(e) => setImportForm({ ...importForm, strategy: e.target.value })}
                                >
                                    {STRATEGY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>📅 進場日 Entry Date</label>
                                    <input
                                        type="date"
                                        value={importForm.entryDate}
                                        onChange={(e) => setImportForm({ ...importForm, entryDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>💰 進場價 Entry Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={importForm.entryPrice || ""}
                                        onChange={(e) => setImportForm({ ...importForm, entryPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            {/* Active Holding Toggle */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem 1rem',
                                background: isActiveHolding ? '#D1FAE5' : '#F7F8FA',
                                border: isActiveHolding ? '1px solid #10B981' : '1px solid #DEE2E6',
                                borderRadius: '0.75rem',
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0F172A' }}>
                                        📦 還在庫存中 (Still Holding)
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                        Toggle ON for active positions without exit data
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsActiveHolding(!isActiveHolding)}
                                    style={{
                                        width: '3.5rem',
                                        height: '1.75rem',
                                        background: isActiveHolding ? '#10b981' : '#DEE2E6',
                                        border: 'none',
                                        borderRadius: '9999px',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'background 0.2s ease',
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute',
                                        top: '0.125rem',
                                        left: isActiveHolding ? '1.875rem' : '0.125rem',
                                        width: '1.5rem',
                                        height: '1.5rem',
                                        background: 'white',
                                        borderRadius: '50%',
                                        transition: 'left 0.2s ease',
                                    }} />
                                </button>
                            </div>

                            {/* Exit Date/Price - Only show if NOT active holding */}
                            {!isActiveHolding && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>📅 出場日 Exit Date</label>
                                        <input
                                            type="date"
                                            value={importForm.exitDate}
                                            onChange={(e) => setImportForm({ ...importForm, exitDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>💰 出場價 Exit Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={importForm.exitPrice || ""}
                                            onChange={(e) => setImportForm({ ...importForm, exitPrice: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>📦 股數 Shares</label>
                                <input
                                    type="number"
                                    step="1000"
                                    value={importForm.quantity}
                                    onChange={(e) => setImportForm({ ...importForm, quantity: parseInt(e.target.value) || 1000 })}
                                />
                            </div>

                            <div className="form-group">
                                <label>📝 備註 Notes</label>
                                <input
                                    type="text"
                                    placeholder="選填..."
                                    value={importForm.notes}
                                    onChange={(e) => setImportForm({ ...importForm, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="import-btn"
                                onClick={submitImport}
                                disabled={importing || !importForm.symbol || !importForm.entryDate || (!isActiveHolding && !importForm.exitDate)}
                            >
                                {importing ? "匯入中..." : "📥 匯入 Import"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )
            }

            <div className="history-header">
                <h2>📈 Trade History</h2>
                <div className="header-actions">
                    <button className="analytics-btn" onClick={() => setShowAnalytics(!showAnalytics)}>
                        📊 {showAnalytics ? "Hide" : "Show"} Analytics
                    </button>
                    <button className="import-action-btn" onClick={() => setShowImport(true)}>
                        ➕ Import Past Data
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {
                history && (
                    <>
                        <div className="history-stats">
                            <div className="stat-card">
                                <span className="stat-label">🎯 Win Rate</span>
                                <span className="stat-value">{history.win_rate.toFixed(1)}%</span>
                                <span className="stat-sub">{history.wins} / {history.total_trades}</span>
                            </div>
                            <div className={`stat-card pl ${history.total_pl >= 0 ? "up" : "down"}`}>
                                <span className="stat-label">💰 Total P/L</span>
                                <span className="stat-value">{formatMoney(history.total_pl)}</span>
                            </div>
                            <div className="stat-card best">
                                <span className="stat-label">🏆 Best Strategy</span>
                                <span className="stat-value">
                                    {history.best_strategy === "BOSS" ? <IconBOSS className="w-5 h-5 inline mr-1" /> : <IconCompany className="w-5 h-5 inline mr-1" />} {history.best_strategy || "-"}
                                </span>
                                <span className="stat-sub">{formatMoney(history.best_pl)}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">📅 Avg. Hold Time</span>
                                <span className="stat-value">
                                    {history.trades.length > 0
                                        ? Math.round(history.trades.reduce((sum, t) => sum + calcDays(t.created_at, t.closed_at), 0) / history.trades.length)
                                        : 0
                                    }
                                </span>
                                <span className="stat-sub">days</span>
                            </div>
                        </div>

                        {/* Advanced Analytics */}
                        {showAnalytics && history.trades.length > 0 && (
                            <div className="analytics-section">
                                <h3>📊 Strategy Performance</h3>
                                <div className="strategy-breakdown">
                                    {getStrategyStats(history.trades).map((stat, idx) => (
                                        <div key={idx} className="strategy-stat-card">
                                            <div className="strategy-stat-header">
                                                {stat.strategy === "BOSS" ? <IconBOSS className="w-5 h-5" /> : <IconCompany className="w-5 h-5" />}
                                                <span className="strategy-name">{stat.subStrategy.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div className="strategy-stat-body">
                                                <div className="stat-row">
                                                    <span>Win Rate:</span>
                                                    <span className={stat.winRate >= 50 ? "up" : "down"}>{stat.winRate.toFixed(1)}%</span>
                                                </div>
                                                <div className="stat-row">
                                                    <span>Total P/L:</span>
                                                    <span className={stat.totalPL >= 0 ? "up" : "down"}>{formatMoney(stat.totalPL)}</span>
                                                </div>
                                                <div className="stat-row">
                                                    <span>Trades:</span>
                                                    <span>{stat.totalTrades}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <h3>📈 Monthly Performance</h3>
                                <div className="monthly-chart">
                                    {getMonthlyStats(history.trades).map((month, idx) => (
                                        <div key={idx} className="month-bar">
                                            <div className="month-label">{month.month.slice(5)}</div>
                                            <div className="month-bar-container">
                                                <div
                                                    className={`month-bar-fill ${month.pl >= 0 ? "up" : "down"}`}
                                                    style={{
                                                        width: `${Math.min(Math.abs(month.pl) / Math.max(...getMonthlyStats(history.trades).map(m => Math.abs(m.pl))) * 100, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className={`month-value ${month.pl >= 0 ? "up" : "down"}`}>
                                                {formatMoney(month.pl)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )
            }

            {/* History Table */}
            {
                history && history.trades && history.trades.length > 0 ? (
                    <div className="history-table">
                        <div className="table-header">
                            <span className="col-date">Exit Date</span>
                            <span className="col-symbol">Symbol</span>
                            <span className="col-strategy">Strategy</span>
                            <span className="col-pl">P/L ($)</span>
                            <span className="col-pct">P/L (%)</span>
                            <span className="col-days">Days</span>
                        </div>
                        {history.trades.map((trade) => (
                            <div key={trade.id} className="table-row">
                                <span className="col-date">{formatDate(trade.closed_at)}</span>
                                <div className="col-symbol">
                                    <span className="company">{trade.company_name}</span>
                                    <span className="symbol">{trade.symbol}</span>
                                </div>
                                <span className={`col-strategy ${trade.strategy.toLowerCase()}`}>
                                    {trade.strategy === "BOSS" ? <IconBOSS className="w-4 h-4 inline mr-1" /> : <IconCompany className="w-4 h-4 inline mr-1" />} {trade.sub_strategy?.replace(/_/g, " ") || trade.strategy}
                                </span>
                                <span className={`col-pl ${trade.final_pl >= 0 ? "up" : "down"}`}>
                                    {formatMoney(trade.final_pl)}
                                </span>
                                <span className={`col-pct ${trade.final_pl_percent >= 0 ? "up" : "down"}`}>
                                    {formatPercent(trade.final_pl_percent)}
                                </span>
                                <span className="col-days">{calcDays(trade.created_at, trade.closed_at)}天</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>📭 No closed trades yet</p>
                        <p className="hint">Use "➕ Import Past Data" to add historical records, or settle open trades in Portfolio.</p>
                    </div>
                )
            }

            {error && <div className="error-message"><AlertTriangleIcon size={16} /> {error}</div>}
        </div>
    );
}
