import { useState, useEffect, useCallback } from "react";
import { StructureType, SubStrategyType, WindType, QuoteData, STRATEGY_LABELS, SUB_STRATEGY_LABELS } from "../types";
import { getStrategyChecklist, getChecklistStatus } from "../utils/strategyChecklist";
import { IconCompany, IconBOSS } from "../../../components/HandDrawnIcons";
import { TargetIcon, CheckCircleIcon, SearchIcon, PawPrintIcon } from "../../../components/Icons";
import "./Watchlist.css";

const API_BASE = "/api/kite";

interface WatchlistEntry {
    id: string;
    symbol: string;
    company_name: string;
    target_price: number;
    strategy: "OFFICE" | "BOSS";
    sub_strategy: SubStrategyType;
    notes: string;
    status: "WATCHING" | "READY" | "ENTERED";
    created_at: string;
}

interface WatchlistConversionData {
    symbol: string;
    companyName: string;
    targetPrice: number;
    strategy: "OFFICE" | "BOSS";
    subStrategy: SubStrategyType;
}

interface WatchlistProps {
    structure: StructureType;
    currentWind: WindType | null;
    onStockSelect?: (symbol: string) => void;
    onConvertToTrade?: (data: WatchlistConversionData) => void;
}

export function Watchlist({ structure, currentWind, onStockSelect, onConvertToTrade }: WatchlistProps) {
    const [entries, setEntries] = useState<WatchlistEntry[]>([]);
    const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
    const [isAdding, setIsAdding] = useState(false);
    const [newEntry, setNewEntry] = useState({
        symbol: "",
        company_name: "",
        target_price: 0,
        strategy: "BOSS" as "OFFICE" | "BOSS",
        sub_strategy: "WEEKLY_PULLBACK" as SubStrategyType,
        notes: "",
    });
    const [loadingCompany, setLoadingCompany] = useState(false);

    // Fetch watchlist on mount
    useEffect(() => {
        fetchWatchlist();
    }, []);

    // Fetch quotes for all watchlist symbols
    useEffect(() => {
        if (entries.length > 0) {
            fetchQuotes(entries.map(e => e.symbol));
        }
    }, [entries]);

    const fetchWatchlist = async () => {
        try {
            const res = await fetch(`${API_BASE}/watchlist`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch watchlist:", error);
        }
    };

    const fetchQuotes = async (symbols: string[]) => {
        if (symbols.length === 0) return;
        try {
            const symbolsQuery = symbols.join(",");
            const res = await fetch(`${API_BASE}/quotes?symbols=${symbolsQuery}`);
            if (res.ok) {
                const data = await res.json();
                const quotesMap: Record<string, QuoteData> = {};
                data.forEach((q: QuoteData) => {
                    // Strip .TW suffix to match Watchlist entry symbols
                    const normalizedSymbol = q.symbol.replace('.TW', '');
                    quotesMap[normalizedSymbol] = q;
                });
                setQuotes(quotesMap);
            }
        } catch (error) {
            console.error("Failed to fetch quotes:", error);
        }
    };

    // Auto-fetch company name when symbol changes
    const fetchCompanyName = useCallback(async (symbol: string) => {
        if (!symbol || symbol.length < 4) return;
        setLoadingCompany(true);
        try {
            const res = await fetch(`${API_BASE}/quote?symbol=${symbol}`);
            if (res.ok) {
                const data = await res.json();
                if (data.company_name) {
                    setNewEntry(prev => ({ ...prev, company_name: data.company_name }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch company name:", error);
        } finally {
            setLoadingCompany(false);
        }
    }, []);

    const addEntry = async () => {
        if (!newEntry.symbol) return;

        try {
            const res = await fetch(`${API_BASE}/watchlist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newEntry),
            });
            if (res.ok) {
                const created = await res.json();
                setEntries([created, ...entries]);
                setNewEntry({
                    symbol: "",
                    company_name: "",
                    target_price: 0,
                    strategy: "BOSS",
                    sub_strategy: "WEEKLY_PULLBACK",
                    notes: "",
                });
                setIsAdding(false);
            }
        } catch (error) {
            console.error("Failed to add watchlist entry:", error);
        }
    };

    const deleteEntry = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/watchlist/${id}`, { method: "DELETE" });
            if (res.ok) {
                setEntries(entries.filter(e => e.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete watchlist entry:", error);
        }
    };

    const convertToTrade = async (entry: WatchlistEntry) => {
        if (onConvertToTrade) {
            // Pass conversion data to parent
            onConvertToTrade({
                symbol: entry.symbol,
                companyName: entry.company_name,
                targetPrice: entry.target_price,
                strategy: entry.strategy as "OFFICE" | "BOSS",
                subStrategy: entry.sub_strategy as SubStrategyType,
            });
        }

        // Mark as ENTERED in backend
        try {
            const res = await fetch(`${API_BASE}/watchlist/${entry.id}/convert`, {
                method: "POST"
            });
            if (res.ok) {
                // Refresh watchlist to update status
                fetchWatchlist();
            }
        } catch (error) {
            console.error("Failed to mark as entered:", error);
        }
    };

    // Get checklist data for an entry (conditions + status)
    const getEntryChecklistData = (entry: WatchlistEntry) => {
        const quote = quotes[entry.symbol] || null;
        // For BOSS strategy, assume YOY > 30% is met since we can't fetch this data
        const revenueYoyChecked = entry.strategy === "BOSS";
        const conditions = getStrategyChecklist(quote, structure, entry.sub_strategy, currentWind, revenueYoyChecked);
        const status = getChecklistStatus(conditions);
        return { conditions, status };
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "READY": return <TargetIcon size={16} />;
            case "ENTERED": return <CheckCircleIcon size={16} />;
            default: return <SearchIcon size={16} />;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case "READY": return "status-ready";
            case "ENTERED": return "status-entered";
            default: return "status-watching";
        }
    };

    return (
        <div className="watchlist-container">
            <div className="watchlist-header">
                <h2><PawPrintIcon size={20} style={{ display: 'inline-block', verticalAlign: 'text-top', marginRight: '6px' }} /> Watchlist</h2>
                <button
                    className="add-btn"
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? "取消" : "+ 新增"}
                </button>
            </div>

            {isAdding && (
                <div className="add-form">
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="股票代號 (e.g. 2330)"
                            value={newEntry.symbol}
                            onChange={(e) => setNewEntry({ ...newEntry, symbol: e.target.value.toUpperCase() })}
                            onBlur={(e) => fetchCompanyName(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder={loadingCompany ? "載入中..." : "公司名稱"}
                            value={newEntry.company_name}
                            onChange={(e) => setNewEntry({ ...newEntry, company_name: e.target.value })}
                            disabled={loadingCompany}
                        />
                    </div>
                    <div className="form-row">
                        <input
                            type="number"
                            placeholder="目標價"
                            value={newEntry.target_price || ""}
                            onChange={(e) => setNewEntry({ ...newEntry, target_price: parseFloat(e.target.value) || 0 })}
                        />
                        <div className="strategy-button-group">
                            <button
                                type="button"
                                className={`strategy-btn ${newEntry.strategy === "OFFICE" ? "active" : ""}`}
                                onClick={() => setNewEntry({ ...newEntry, strategy: "OFFICE", sub_strategy: "STRONG_WEEKLY" })}
                            >
                                <IconCompany style={{ width: 20, height: 20 }} />
                                <span>{STRATEGY_LABELS.OFFICE.zh}</span>
                            </button>
                            <button
                                type="button"
                                className={`strategy-btn ${newEntry.strategy === "BOSS" ? "active" : ""}`}
                                onClick={() => setNewEntry({ ...newEntry, strategy: "BOSS", sub_strategy: "WEEKLY_PULLBACK" })}
                            >
                                <IconBOSS style={{ width: 20, height: 20 }} />
                                <span>{STRATEGY_LABELS.BOSS.zh}</span>
                            </button>
                        </div>
                    </div>
                    <div className="form-row">
                        <select
                            value={newEntry.sub_strategy}
                            onChange={(e) => setNewEntry({ ...newEntry, sub_strategy: e.target.value as SubStrategyType })}
                        >
                            {newEntry.strategy === "OFFICE" ? (
                                <>
                                    <option value="STRONG_WEEKLY">{SUB_STRATEGY_LABELS.STRONG_WEEKLY.badge} {SUB_STRATEGY_LABELS.STRONG_WEEKLY.zh}</option>
                                    <option value="WEEKLY_TREND">{SUB_STRATEGY_LABELS.WEEKLY_TREND.badge} {SUB_STRATEGY_LABELS.WEEKLY_TREND.zh}</option>
                                </>
                            ) : (
                                <>
                                    <option value="WEEKLY_PULLBACK">{SUB_STRATEGY_LABELS.WEEKLY_PULLBACK.badge} {SUB_STRATEGY_LABELS.WEEKLY_PULLBACK.zh}</option>
                                    <option value="CHEAP_ACQUISITION">{SUB_STRATEGY_LABELS.CHEAP_ACQUISITION.badge} {SUB_STRATEGY_LABELS.CHEAP_ACQUISITION.zh}</option>
                                </>
                            )}
                        </select>
                    </div>
                    <textarea
                        placeholder="備註"
                        value={newEntry.notes}
                        onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    />
                    <button className="submit-btn" onClick={addEntry}>加入觀察</button>
                </div>
            )}

            <div className="watchlist-entries">
                {entries.length === 0 ? (
                    <p className="empty-message">尚無觀察標的</p>
                ) : (
                    entries.map((entry) => {
                        const quote = quotes[entry.symbol];
                        const { conditions, status: checklistStatus } = getEntryChecklistData(entry);
                        const canEnter = checklistStatus.allPassed;

                        return (
                            <div
                                key={entry.id}
                                className={`watchlist-entry ${getStatusClass(entry.status)}`}
                                onClick={() => onStockSelect?.(entry.symbol)}
                            >
                                <div className="entry-header">
                                    <span className="status-icon">{getStatusIcon(entry.status)}</span>
                                    <span className="symbol">{entry.symbol}</span>
                                    <span className="company">{entry.company_name}</span>
                                </div>

                                <div className="entry-details">
                                    <div className="price-info">
                                        <span className="target">目標: ${entry.target_price}</span>
                                        <span className="current-price">
                                            現價: {quote ? `$${quote.price.toFixed(2)}` : "載入中..."}
                                        </span>
                                        {quote && entry.target_price > 0 && (
                                            <span className={`price-diff ${quote.price <= entry.target_price ? "below-target" : "above-target"}`}>
                                                ({((quote.price - entry.target_price) / entry.target_price * 100).toFixed(1)}%)
                                            </span>
                                        )}
                                    </div>
                                    <div className="strategy-info">
                                        <span className="strategy-badge">
                                            {SUB_STRATEGY_LABELS[entry.sub_strategy]?.badge}
                                            {SUB_STRATEGY_LABELS[entry.sub_strategy]?.zh}
                                        </span>
                                    </div>
                                </div>

                                {/* Mini Checklist */}
                                <div className="mini-checklist">
                                    <div className="mini-checklist-header">
                                        <span>策略條件</span>
                                        <span className={`mini-count ${canEnter ? "all-pass" : ""}`}>
                                            {checklistStatus.passed}/{checklistStatus.total}
                                        </span>
                                    </div>
                                    <div className="mini-conditions">
                                        {conditions.map((c) => (
                                            <div key={c.id} className={`mini-condition ${c.met ? "met" : "unmet"}`}>
                                                <span className="mini-icon">{c.met ? "✓" : "✕"}</span>
                                                <span className="mini-label">{c.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {entry.notes && (
                                    <p className="notes">{entry.notes}</p>
                                )}

                                <div className="entry-actions">
                                    {entry.status === "WATCHING" && (
                                        <button
                                            className={`action-btn enter ${canEnter ? "enabled" : "disabled"}`}
                                            onClick={(e) => { e.stopPropagation(); if (canEnter) convertToTrade(entry); }}
                                            disabled={!canEnter}
                                            title={canEnter ? "條件達成，可進場" : "條件未達成"}
                                        >
                                            {canEnter ? "🚀 進場" : "🔒 條件未滿足"}
                                        </button>
                                    )}
                                    <button
                                        className="action-btn delete"
                                        onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
