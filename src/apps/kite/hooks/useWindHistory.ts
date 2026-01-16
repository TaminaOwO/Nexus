import { useState, useEffect, useCallback } from "react";
import { WindRecord, WindType } from "../types";

const STORAGE_KEY = "kite-wind-history";

/**
 * Get date string in YYYY-MM-DD format for a given offset from today.
 * @param daysAgo - Number of days ago (0 = today, 1 = yesterday, etc.)
 */
export function getDateString(daysAgo: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split("T")[0];
}

/**
 * Custom hook for managing wind history with localStorage persistence.
 */
export function useWindHistory() {
    const [history, setHistory] = useState<WindRecord[]>([]);
    const [todayWind, setTodayWind] = useState<WindType | null>(null);

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as WindRecord[];
                setHistory(parsed);

                // Check if today's entry exists
                const today = getDateString(0);
                const todayEntry = parsed.find((r) => r.date === today);
                if (todayEntry) {
                    setTodayWind(todayEntry.wind);
                }
            }
        } catch (error) {
            console.error("Failed to load wind history:", error);
        }
    }, []);

    // Persist history to localStorage
    const persistHistory = useCallback((records: WindRecord[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        } catch (error) {
            console.error("Failed to save wind history:", error);
        }
    }, []);

    // Add or update today's wind record
    const recordWind = useCallback((wind: WindType) => {
        const today = getDateString(0);

        setHistory((prev) => {
            // Remove existing entry for today if any
            const filtered = prev.filter((r) => r.date !== today);

            // Add new entry and sort by date
            const updated = [...filtered, { date: today, wind }].sort(
                (a, b) => a.date.localeCompare(b.date)
            );

            // Keep only last 30 days to prevent localStorage bloat
            const trimmed = updated.slice(-30);
            persistHistory(trimmed);
            return trimmed;
        });

        setTodayWind(wind);
    }, [persistHistory]);

    // Set wind for a specific date (Dev Mode feature)
    const setHistoryForDate = useCallback((date: string, wind: WindType | null) => {
        setHistory((prev) => {
            // Remove existing entry for this date
            let updated = prev.filter((r) => r.date !== date);

            // Add new entry if wind is not null
            if (wind !== null) {
                updated = [...updated, { date, wind }];
            }

            // Sort by date
            updated.sort((a, b) => a.date.localeCompare(b.date));

            // Keep only last 30 days
            const trimmed = updated.slice(-30);
            persistHistory(trimmed);

            // Update todayWind if we modified today's entry
            const today = getDateString(0);
            if (date === today) {
                setTodayWind(wind);
            }

            return trimmed;
        });
    }, [persistHistory]);

    // Clear all history (for reset functionality)
    const clearHistory = useCallback(() => {
        setHistory([]);
        setTodayWind(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        history,
        todayWind,
        recordWind,
        setHistoryForDate,
        clearHistory,
    };
}
