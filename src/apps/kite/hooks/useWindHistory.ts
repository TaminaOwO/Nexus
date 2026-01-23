import { useState, useEffect, useCallback, useRef } from "react";
import { WindRecord, WindType } from "../types";

const API_BASE = "/api/kite";

// Taiwan public holidays for 2024-2026 (can be extended as needed)
const TW_HOLIDAYS: Set<string> = new Set([
    // 2024
    "2024-01-01", // New Year
    "2024-02-08", "2024-02-09", "2024-02-10", "2024-02-11", "2024-02-12", "2024-02-13", "2024-02-14", // CNY
    "2024-02-28", // Peace Memorial Day
    "2024-04-04", "2024-04-05", // Tomb Sweeping
    "2024-05-01", // Labor Day
    "2024-06-10", // Dragon Boat
    "2024-09-17", // Mid-Autumn
    "2024-10-10", // National Day
    // 2025
    "2025-01-01", // New Year
    "2025-01-27", "2025-01-28", "2025-01-29", "2025-01-30", "2025-01-31", // CNY
    "2025-02-28", // Peace Memorial Day
    "2025-04-03", "2025-04-04", // Tomb Sweeping
    "2025-05-01", // Labor Day
    "2025-05-31", // Dragon Boat (estimated)
    "2025-10-06", // Mid-Autumn (estimated)
    "2025-10-10", // National Day
    // 2026
    "2026-01-01", // New Year
    "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20", // CNY (estimated)
    "2026-02-28", // Peace Memorial Day (Saturday - may have makeup)
    "2026-04-04", "2026-04-05", "2026-04-06", // Tomb Sweeping
    "2026-05-01", // Labor Day
    "2026-06-19", // Dragon Boat (estimated)
    "2026-09-25", // Mid-Autumn (estimated)
    "2026-10-10", // National Day
]);

/**
 * Check if a date is a Taiwan trading day (weekday and not a holiday)
 */
export function isTradingDay(dateStr: string): boolean {
    const date = new Date(dateStr + "T00:00:00");
    const dayOfWeek = date.getDay();

    // Weekend check (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }

    // Holiday check
    if (TW_HOLIDAYS.has(dateStr)) {
        return false;
    }

    return true;
}

/**
 * Get date string in YYYY-MM-DD format for a given offset from today.
 * @param daysAgo - Number of days ago (0 = today, 1 = yesterday, etc.)
 */
export function getDateString(daysAgo: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    // Use local time instead of UTC to avoid date shift issues
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
}

/**
 * Get the last N trading days (excluding weekends and holidays)
 * @param n - Number of trading days to get
 * @returns Array of date strings in YYYY-MM-DD format, from oldest to newest
 */
export function getLastNTradingDays(n: number): string[] {
    const tradingDays: string[] = [];
    let daysBack = 1; // Start from yesterday (not today)

    while (tradingDays.length < n && daysBack < 30) { // Max 30 days lookback
        const dateStr = getDateString(daysBack);
        if (isTradingDay(dateStr)) {
            tradingDays.unshift(dateStr); // Add to front (oldest first)
        }
        daysBack++;
    }

    return tradingDays;
}

/**
 * Custom hook for managing wind history with Backend persistence.
 */
export function useWindHistory() {
    const [history, setHistory] = useState<WindRecord[]>([]);
    const [todayWind, setTodayWind] = useState<WindType | null>(null);
    const lastCheckedDate = useRef<string>(getDateString(0));

    // Load history from Backend on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch History
                const histRes = await fetch(`${API_BASE}/wind/history`);
                if (histRes.ok) {
                    const data = await histRes.json();
                    // Normalize date format from backend (ISO 8601 → YYYY-MM-DD)
                    const normalized = data.map((record: any) => ({
                        ...record,
                        date: record.date.split('T')[0] // Extract YYYY-MM-DD from ISO 8601
                    }));
                    setHistory(normalized || []);
                }

                // Fetch Today's Wind
                const todayRes = await fetch(`${API_BASE}/wind/latest`);
                if (todayRes.ok) {
                    const data = await todayRes.json();
                    if (data && data.wind) {
                        setTodayWind(data.wind as WindType);
                    }
                }
            } catch (error) {
                console.error("Failed to load wind history:", error);
            }
        };

        fetchHistory();
    }, []);

    // Check for date change and auto-archive yesterday's wind
    useEffect(() => {
        const checkDateChange = () => {
            const currentDate = getDateString(0);
            if (lastCheckedDate.current !== currentDate) {
                // Date has changed - the wind from the previous session is now in history
                // Re-fetch to get updated history
                lastCheckedDate.current = currentDate;
                setTodayWind(null); // Reset today's wind for new day

                // Re-fetch history to include yesterday's entry
                fetch(`${API_BASE}/wind/history`)
                    .then(res => res.ok ? res.json() : [])
                    .then(data => {
                        // Normalize date format
                        const normalized = data.map((record: any) => ({
                            ...record,
                            date: record.date.split('T')[0]
                        }));
                        setHistory(normalized || []);
                    })
                    .catch(err => console.error("Failed to refresh history:", err));
            }
        };

        // Check immediately
        checkDateChange();

        // Check periodically (every minute)
        const interval = setInterval(checkDateChange, 60000);
        return () => clearInterval(interval);
    }, []);

    // Add or update today's wind record
    const recordWind = useCallback(async (wind: WindType) => {
        const today = getDateString(0);

        // Optimistic update
        setTodayWind(wind);
        setHistory((prev) => {
            const filtered = prev.filter((r) => r.date !== today);
            return [...filtered, { date: today, wind }].sort((a, b) => a.date.localeCompare(b.date));
        });

        try {
            await fetch(`${API_BASE}/wind`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date: today, wind }),
            });
        } catch (error) {
            console.error("Failed to save wind:", error);
            // Revert on error if needed, for now just log
        }
    }, []);

    // Set wind for a specific date (Dev Mode feature)
    const setHistoryForDate = useCallback(async (date: string, wind: WindType | null) => {
        // Optimistic update
        setHistory((prev) => {
            let updated = prev.filter((r) => r.date !== date);
            if (wind !== null) {
                updated = [...updated, { date, wind }];
            }
            updated.sort((a, b) => a.date.localeCompare(b.date));
            return updated;
        });

        if (date === getDateString(0)) {
            setTodayWind(wind);
        }

        if (wind) {
            try {
                await fetch(`${API_BASE}/wind`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ date, wind }),
                });
            } catch (error) {
                console.error("Failed to save wind history:", error);
            }
        }
    }, []);

    // Clear all history (Reset) - Note: Backend API doesn't have clear endpoint yet
    // Implementation: Just clear local state for now, or add an endpoint if critical.
    // User didn't explicitly ask for Clear persistence, so local clear is fine.
    const clearHistory = useCallback(() => {
        setHistory([]);
        setTodayWind(null);
    }, []);

    return {
        history,
        todayWind,
        recordWind,
        setHistoryForDate,
        clearHistory,
        getLastNTradingDays,
    };
}
