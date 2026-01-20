import { useState, useEffect } from "react";
import { StructureType, SubStrategyType, STRATEGY_LABELS, SUB_STRATEGY_LABELS } from "../types";
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

interface WatchlistProps {
    structure: StructureType;
    onStockSelect?: (symbol: string) => void;
}

export function Watchlist({ structure: _structure, onStockSelect }: WatchlistProps) {
    const [entries, setEntries] = useState<WatchlistEntry[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newEntry, setNewEntry] = useState({
        symbol: "",
        company_name: "",
        target_price: 0,
        strategy: "BOSS" as "OFFICE" | "BOSS",
        sub_strategy: "WEEKLY_PULLBACK" as SubStrategyType,
        notes: "",
    });

    // Fetch watchlist on mount
    useEffect(() => {
        fetchWatchlist();
    }, []);

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

    const markAsReady = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/watchlist/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "READY" }),
            });
            if (res.ok) {
                const updated = await res.json();
                setEntries(entries.map(e => e.id === id ? updated : e));
            }
        } catch (error) {
            console.error("Failed to update watchlist entry:", error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "READY": return "🎯";
            case "ENTERED": return "✅";
            default: return "👀";
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
                <h2>📋 Watchlist</h2>
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
                        />
                        <input
                            type="text"
                            placeholder="公司名稱"
                            value={newEntry.company_name}
                            onChange={(e) => setNewEntry({ ...newEntry, company_name: e.target.value })}
                        />
                    </div>
                    <div className="form-row">
                        <input
                            type="number"
                            placeholder="目標價"
                            value={newEntry.target_price || ""}
                            onChange={(e) => setNewEntry({ ...newEntry, target_price: parseFloat(e.target.value) || 0 })}
                        />
                        <select
                            value={newEntry.strategy}
                            onChange={(e) => setNewEntry({ ...newEntry, strategy: e.target.value as "OFFICE" | "BOSS" })}
                        >
                            <option value="OFFICE">🏢 上班族型</option>
                            <option value="BOSS">🛡️ 老闆型</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <select
                            value={newEntry.sub_strategy}
                            onChange={(e) => setNewEntry({ ...newEntry, sub_strategy: e.target.value as SubStrategyType })}
                        >
                            <option value="STRONG_WEEKLY">⚡ 強勢週</option>
                            <option value="WEEKLY_TREND">📉 週趨勢</option>
                            <option value="WEEKLY_PULLBACK">🔄 週拉回</option>
                            <option value="CHEAP_ACQUISITION">🏷️ 廉價收購</option>
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
                    entries.map((entry) => (
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
                                <span className="target">目標價: ${entry.target_price}</span>
                                <span className="strategy">
                                    {STRATEGY_LABELS[entry.strategy]?.badge}
                                    {SUB_STRATEGY_LABELS[entry.sub_strategy]?.zh}
                                </span>
                            </div>
                            {entry.notes && (
                                <p className="notes">{entry.notes}</p>
                            )}
                            <div className="entry-actions">
                                {entry.status === "WATCHING" && (
                                    <button
                                        className="action-btn ready"
                                        onClick={(e) => { e.stopPropagation(); markAsReady(entry.id); }}
                                    >
                                        🎯 標記可進場
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
                    ))
                )}
            </div>
        </div>
    );
}
