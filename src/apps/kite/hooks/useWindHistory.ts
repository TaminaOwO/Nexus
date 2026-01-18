import { useState, useEffect, useCallback } from "react";
import { WindRecord, WindType } from "../types";

const API_BASE = "/api/kite";

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
 * Custom hook for managing wind history with Backend persistence.
 */
export function useWindHistory() {
    const [history, setHistory] = useState<WindRecord[]>([]);
    const [todayWind, setTodayWind] = useState<WindType | null>(null);

    // Load history from Backend on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch History
                const histRes = await fetch(`${API_BASE}/wind/history`);
                if (histRes.ok) {
                    const data = await histRes.json();
                    // Map API response to frontend WindRecord if needed
                    // Assuming API returns matches WindRecord interface
                    setHistory(data || []);
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
    };
}
