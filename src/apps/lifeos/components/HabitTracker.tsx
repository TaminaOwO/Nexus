import { useState, useEffect } from "react";
import { fetchHabits, fetchHabitLogs, checkHabit } from "../api";
import type { Habit, HabitLog } from "../types";
import "./HabitTracker.css";

// Inline Hand-Drawn Check Icon
const IconCheck = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
    </svg>
);

export function HabitTracker({ compact = false }: { compact?: boolean }) {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<Record<string, HabitLog[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 載入習慣列表
    useEffect(() => {
        loadHabits();
    }, []);

    async function loadHabits() {
        try {
            setLoading(true);
            const data = await fetchHabits();
            setHabits(data);

            // 載入每個習慣的記錄（用於計算 Streak）
            const logsMap: Record<string, HabitLog[]> = {};
            for (const habit of data) {
                const habitLogs = await fetchHabitLogs(habit.id);
                logsMap[habit.id] = habitLogs;
            }
            setLogs(logsMap);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load habits");
        } finally {
            setLoading(false);
        }
    }

    // 計算 Streak（連勝天數）
    function calculateStreak(habitId: string): number {
        const habitLogs = logs[habitId] || [];
        const sortedLogs = habitLogs
            .filter((log) => log.status === "Done")
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (sortedLogs.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < sortedLogs.length; i++) {
            const logDate = new Date(sortedLogs[i].date);
            logDate.setHours(0, 0, 0, 0);

            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);

            if (logDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    // 檢查今日是否已完成
    function isCompletedToday(habitId: string): boolean {
        const habitLogs = logs[habitId] || [];
        const today = new Date().toISOString().split("T")[0];
        return habitLogs.some((log) => log.date === today && log.status === "Done");
    }

    // 打卡切換
    async function toggleHabit(habitId: string) {
        const today = new Date().toISOString().split("T")[0];
        const completed = isCompletedToday(habitId);

        try {
            await checkHabit(habitId, {
                date: today,
                status: completed ? "Skipped" : "Done",
            });
            await loadHabits(); // 重新載入
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to check habit");
        }
    }

    if (loading) return <div className="habit-tracker">Loading...</div>;
    if (error) return <div className="habit-tracker error">{error}</div>;

    const displayHabits = compact ? habits.slice(0, 3) : habits;

    return (
        <div className={`habit-tracker ${compact ? "compact" : ""}`}>
            {!compact && (
                <div className="tracker-header">
                    <h2>Habit Streaks</h2>
                    <button className="add-habit-btn">+ New Habit</button>
                </div>
            )}

            <div className="habit-list">
                {displayHabits.map((habit) => {
                    const completed = isCompletedToday(habit.id);
                    const streak = calculateStreak(habit.id);

                    return (
                        <div
                            key={habit.id}
                            className={`habit-row ${completed ? "completed" : ""}`}
                            onClick={() => toggleHabit(habit.id)}
                        >
                            <div className="checkbox-container">
                                <div className="hand-checkbox">
                                    {completed && <IconCheck className="check-icon" />}
                                </div>
                            </div>
                            <div className="habit-info">
                                <span className="habit-text">{habit.name}</span>
                                <span className="habit-streak">{streak} day streak</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            {compact && habits.length > 3 && (
                <div className="more-habits">+ {habits.length - 3} more habits...</div>
            )}
        </div>
    );
}
