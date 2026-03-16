import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchHabits, fetchHabitLogs, fetchTasks } from "../api";
import type { Habit, HabitLog, Task } from "../types";
import { ZapIcon, ClipboardIcon, TargetIcon, ChartLineIcon, FlameIcon } from "../../../components/Icons";
import "./WarRoom.css";

// ========== Local Types (Kite API response shapes, no cross-module import) ==========

interface KiteHolding {
    symbol: string;
    company_name: string;
    current_price: number;
    unrealized_pl: number;
    unrealized_pl_percent: number;
    strategy_alerts: string[];
}

interface KiteAlert {
    type: string;
    symbol: string;
    message: string;
}

interface KitePortfolioResponse {
    holdings: KiteHolding[];
    alerts: KiteAlert[];
    total_cost: number;
    market_value: number;
    total_pl: number;
    total_pl_percent: number;
}

interface KiteWindRecord {
    date: string;
    wind: WindType;
}

type WindType = "STRONG" | "TURBULENT" | "GUSTY" | "CALM";
type StructureType = "EASY_RISE" | "EASY_FALL" | "BOUNDARY";
type GateLight = "GREEN" | "YELLOW" | "RED";

// ========== Gate Light Logic (replicated from Kite, ~40 lines pure functions) ==========

function calculateStructure(history: KiteWindRecord[]): StructureType {
    const recentHistory = history.slice(-5);
    if (recentHistory.length === 0) return "BOUNDARY";

    let bullishCount = 0;
    let bearishCount = 0;

    for (const record of recentHistory) {
        if (record.wind === "STRONG" || record.wind === "TURBULENT") {
            bullishCount++;
        } else {
            bearishCount++;
        }
    }

    const total = recentHistory.length;
    const majorityThreshold = total / 2;

    if (bullishCount > majorityThreshold) return "EASY_RISE";
    if (bearishCount > majorityThreshold) return "EASY_FALL";
    return "BOUNDARY";
}

function getGateLight(structure: StructureType, todayWind: WindType | null): GateLight {
    if (todayWind === null) return "YELLOW";
    if (todayWind === "CALM") return "RED";
    if (structure === "EASY_FALL") return "RED";
    if (structure === "EASY_RISE") {
        return todayWind === "STRONG" ? "GREEN" : "YELLOW";
    }
    // BOUNDARY
    return todayWind === "STRONG" ? "YELLOW" : "RED";
}

// ========== Display Constants ==========

const WIND_DISPLAY: Record<WindType, { emoji: string; zh: string }> = {
    STRONG:    { emoji: "\u{1F985}", zh: "\u5F37\u98A8" },
    TURBULENT: { emoji: "\u{1F32A}\uFE0F", zh: "\u4E82\u6D41" },
    GUSTY:     { emoji: "\u{1F343}", zh: "\u9663\u98A8" },
    CALM:      { emoji: "\u{1F422}", zh: "\u7121\u98A8" },
};

const GATE_DISPLAY: Record<GateLight, { emoji: string; label: string; className: string }> = {
    GREEN:  { emoji: "\u{1F7E2}", label: "GREEN",  className: "green" },
    YELLOW: { emoji: "\u{1F7E1}", label: "YELLOW", className: "yellow" },
    RED:    { emoji: "\u{1F534}", label: "RED",     className: "red" },
};

// ========== Helpers ==========

function formatPL(value: number): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPLPercent(value: number): string {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
}

function isTaiwanMarketOpen(): boolean {
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) return false;
    const hours = now.getHours();
    const mins = now.getMinutes();
    if (hours < 9 || hours > 13) return false;
    if (hours === 13 && mins > 30) return false;
    return true;
}

// ========== Custom Hook ==========

interface WarRoomData {
    kite: {
        totalPL: number;
        totalPLPercent: number;
        holdingsCount: number;
        alertsCount: number;
        windType: WindType | null;
        gateLight: GateLight;
        available: boolean;
    };
    lifeos: {
        habitsCompletedToday: number;
        totalHabits: number;
        maxStreak: number;
        pendingTodayTasks: number;
        doneThisWeek: number;
        available: boolean;
    };
    loading: boolean;
}

function useWarRoomData(): WarRoomData {
    const [kitePortfolio, setKitePortfolio] = useState<KitePortfolioResponse | null>(null);
    const [windHistory, setWindHistory] = useState<KiteWindRecord[]>([]);
    const [todayWind, setTodayWind] = useState<WindType | null>(null);
    const [kiteAvailable, setKiteAvailable] = useState(true);

    const [habits, setHabits] = useState<Habit[]>([]);
    const [habitLogs, setHabitLogs] = useState<Record<string, HabitLog[]>>({});
    const [tasks, setTasks] = useState<Task[]>([]);
    const [lifeosAvailable, setLifeosAvailable] = useState(true);

    const [loading, setLoading] = useState(true);

    const loadKiteData = useCallback(async (silent = false) => {
        try {
            const results = await Promise.allSettled([
                fetch("/api/kite/portfolio"),
                fetch("/api/kite/wind/latest"),
                fetch("/api/kite/wind/history"),
            ]);

            // Portfolio
            if (results[0].status === "fulfilled" && results[0].value.ok) {
                setKitePortfolio(await results[0].value.json());
            }

            // Today's wind
            if (results[1].status === "fulfilled" && results[1].value.ok) {
                const data = await results[1].value.json();
                setTodayWind(data?.wind || null);
            }

            // Wind history
            if (results[2].status === "fulfilled" && results[2].value.ok) {
                const data = await results[2].value.json();
                setWindHistory(
                    (data || []).map((r: KiteWindRecord & { date: string }) => ({
                        ...r,
                        date: r.date.split("T")[0],
                    }))
                );
            }

            // At least one succeeded
            const anySuccess = results.some(
                (r) => r.status === "fulfilled" && r.value.ok
            );
            setKiteAvailable(anySuccess);
        } catch {
            if (!silent) setKiteAvailable(false);
        }
    }, []);

    const loadLifeOSData = useCallback(async () => {
        try {
            const [habitsData, tasksData] = await Promise.all([
                fetchHabits(),
                fetchTasks(),
            ]);
            setHabits(habitsData);
            setTasks(tasksData);

            const logsMap: Record<string, HabitLog[]> = {};
            for (const habit of habitsData) {
                logsMap[habit.id] = await fetchHabitLogs(habit.id);
            }
            setHabitLogs(logsMap);
            setLifeosAvailable(true);
        } catch {
            setLifeosAvailable(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        async function init() {
            setLoading(true);
            await Promise.all([loadKiteData(), loadLifeOSData()]);
            setLoading(false);
        }
        init();
    }, [loadKiteData, loadLifeOSData]);

    // Auto-refresh Kite every 30s during market hours
    useEffect(() => {
        const interval = setInterval(() => {
            if (isTaiwanMarketOpen()) {
                loadKiteData(true);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [loadKiteData]);

    // Compute gate light
    const gateLight = useMemo(() => {
        const structure = calculateStructure(windHistory);
        return getGateLight(structure, todayWind);
    }, [windHistory, todayWind]);

    // Compute LifeOS stats
    const lifeosStats = useMemo(() => {
        const today = new Date().toISOString().split("T")[0];

        // Today's habit completion
        let completedToday = 0;
        for (const habitId of Object.keys(habitLogs)) {
            const done = (habitLogs[habitId] || []).some(
                (log) => log.date === today && log.status === "Done"
            );
            if (done) completedToday++;
        }

        // Max streak
        let maxStreak = 0;
        for (const habitId of Object.keys(habitLogs)) {
            const sorted = (habitLogs[habitId] || [])
                .filter((l) => l.status === "Done")
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            let streak = 0;
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            for (let i = 0; i < sorted.length; i++) {
                const logDate = new Date(sorted[i].date);
                logDate.setHours(0, 0, 0, 0);
                const expected = new Date(now);
                expected.setDate(now.getDate() - i);
                if (logDate.getTime() === expected.getTime()) {
                    streak++;
                } else break;
            }
            if (streak > maxStreak) maxStreak = streak;
        }

        // Pending today tasks
        const pendingTodayTasks = tasks.filter(
            (t) => t.column === "today"
        ).length;

        // Done this week
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const doneThisWeek = tasks.filter((t) => {
            if (t.column !== "done") return false;
            const dateStr = t.completed_at || t.updated_at;
            const completed = new Date(dateStr);
            return completed >= startOfWeek;
        }).length;

        return { completedToday, maxStreak, pendingTodayTasks, doneThisWeek };
    }, [habitLogs, tasks]);

    return {
        kite: {
            totalPL: kitePortfolio?.total_pl ?? 0,
            totalPLPercent: kitePortfolio?.total_pl_percent ?? 0,
            holdingsCount: kitePortfolio?.holdings?.length ?? 0,
            alertsCount: kitePortfolio?.alerts?.length ?? 0,
            windType: todayWind,
            gateLight,
            available: kiteAvailable,
        },
        lifeos: {
            habitsCompletedToday: lifeosStats.completedToday,
            totalHabits: habits.length,
            maxStreak: lifeosStats.maxStreak,
            pendingTodayTasks: lifeosStats.pendingTodayTasks,
            doneThisWeek: lifeosStats.doneThisWeek,
            available: lifeosAvailable,
        },
        loading,
    };
}

// ========== War Room Component ==========

interface WarRoomProps {
    onNavigateTab: (tab: "overview" | "habits" | "todos") => void;
}

export function WarRoom({ onNavigateTab }: WarRoomProps) {
    const { kite, lifeos, loading } = useWarRoomData();

    if (loading) {
        return (
            <div className="war-room">
                <h2 className="war-room-title">戰情室 War Room</h2>
                <div className="war-room-grid">
                    <div className="skeleton-card" />
                    <div className="skeleton-card" />
                </div>
            </div>
        );
    }

    const gateDisplay = GATE_DISPLAY[kite.gateLight];
    const windDisplay = kite.windType ? WIND_DISPLAY[kite.windType] : null;

    return (
        <div className="war-room">
            <h2 className="war-room-title">戰情室 War Room</h2>

            <div className="war-room-grid">
                {/* ===== Kite Summary Card ===== */}
                <div className="war-card">
                    <div className="war-card-header">
                        <span className="war-card-icon">{"\u{1FA81}"}</span>
                        <span className="war-card-label">Kite 交易</span>
                        <span className={`gate-light-badge ${gateDisplay.className}`}>
                            {gateDisplay.emoji} {gateDisplay.label}
                        </span>
                    </div>
                    {kite.available ? (
                        <div className="war-card-body">
                            <div className="war-stat-row">
                                <span className="war-stat-label">今日損益</span>
                                <span className={`war-stat-value ${kite.totalPL >= 0 ? "up" : "down"}`}>
                                    {formatPL(kite.totalPL)} ({formatPLPercent(kite.totalPLPercent)})
                                </span>
                            </div>
                            <div className="war-stat-row">
                                <span className="war-stat-label">持倉數</span>
                                <span className="war-stat-value">
                                    {kite.holdingsCount} 檔
                                </span>
                            </div>
                            <div className="war-stat-row">
                                <span className="war-stat-label">策略警報</span>
                                <span className={`war-stat-value ${kite.alertsCount > 0 ? "alert" : ""}`}>
                                    {kite.alertsCount > 0 ? `${kite.alertsCount} 則` : "無"}
                                </span>
                            </div>
                            <div className="war-stat-row">
                                <span className="war-stat-label">今日風型</span>
                                <span className="war-stat-value">
                                    {windDisplay
                                        ? `${windDisplay.emoji} ${windDisplay.zh}`
                                        : "尚未記錄"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="war-card-error">
                            Kite 離線中 — 無法取得交易資料
                        </div>
                    )}
                </div>

                {/* ===== LifeOS Summary Card ===== */}
                <div className="war-card">
                    <div className="war-card-header">
                        <span className="war-card-icon">{"\u{1F9E0}"}</span>
                        <span className="war-card-label">LifeOS 生活</span>
                    </div>
                    {lifeos.available ? (
                        <div className="war-card-body">
                            <div className="war-stat-row">
                                <span className="war-stat-label">今日習慣</span>
                                <span className="war-stat-value">
                                    {lifeos.totalHabits > 0
                                        ? `${lifeos.habitsCompletedToday}/${lifeos.totalHabits} ✓`
                                        : "—"}
                                </span>
                            </div>
                            <div className="war-stat-row">
                                <span className="war-stat-label">最長連勝</span>
                                <span className="war-stat-value">
                                    {lifeos.maxStreak > 0
                                        ? <><FlameIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '2px' }} /> {lifeos.maxStreak} 天</>
                                        : "—"}
                                </span>
                            </div>
                            <div className="war-stat-row">
                                <span className="war-stat-label">今日待辦</span>
                                <span className="war-stat-value">
                                    {lifeos.pendingTodayTasks} 個
                                </span>
                            </div>
                            <div className="war-stat-row">
                                <span className="war-stat-label">本週完成</span>
                                <span className="war-stat-value">
                                    {lifeos.doneThisWeek} 個
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="war-card-error">
                            LifeOS 離線中 — 無法取得生活資料
                        </div>
                    )}
                </div>
            </div>

            {/* ===== Quick Actions ===== */}
            <div className="war-quick-actions">
                <h3><ZapIcon size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> 快速行動</h3>
                <div className="quick-action-grid">
                    <a href="/kite" className="quick-action-btn kite-action">
                        {"\u{1FA81}"} 記錄風型
                    </a>
                    <button
                        className="quick-action-btn"
                        onClick={() => onNavigateTab("todos")}
                    >
                        <ClipboardIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> 新增任務
                    </button>
                    <button
                        className="quick-action-btn"
                        onClick={() => onNavigateTab("habits")}
                    >
                        <TargetIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> 記錄習慣
                    </button>
                    <a href="/kite" className="quick-action-btn kite-action">
                        <ChartLineIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> 查看持倉
                    </a>
                </div>
            </div>
        </div>
    );
}
