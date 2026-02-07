import { useState, useEffect, useMemo } from "react";
import { fetchHabits, fetchHabitLogs, fetchTasks } from "../api";
import type { Habit, HabitLog, Task } from "../types";

export function OverviewStats() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<Record<string, HabitLog[]>>({});
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [habitsData, tasksData] = await Promise.all([
                fetchHabits(),
                fetchTasks(),
            ]);
            setHabits(habitsData);
            setTasks(tasksData);

            // 載入 logs
            const logsMap: Record<string, HabitLog[]> = {};
            for (const habit of habitsData) {
                logsMap[habit.id] = await fetchHabitLogs(habit.id);
            }
            setLogs(logsMap);
        } catch {
            // 靜默失敗，stats 不阻斷頁面
        } finally {
            setLoading(false);
        }
    }

    const stats = useMemo(() => {
        const today = new Date().toISOString().split("T")[0];

        // 今日習慣完成數
        let completedToday = 0;
        for (const habitId of Object.keys(logs)) {
            const done = (logs[habitId] || []).some(
                (log) => log.date === today && log.status === "Done"
            );
            if (done) completedToday++;
        }

        // 最長活躍 Streak
        let maxStreak = 0;
        for (const habitId of Object.keys(logs)) {
            const habitLogs = (logs[habitId] || [])
                .filter((l) => l.status === "Done")
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            let streak = 0;
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            for (let i = 0; i < habitLogs.length; i++) {
                const logDate = new Date(habitLogs[i].date);
                logDate.setHours(0, 0, 0, 0);
                const expected = new Date(now);
                expected.setDate(now.getDate() - i);
                if (logDate.getTime() === expected.getTime()) {
                    streak++;
                } else break;
            }
            if (streak > maxStreak) maxStreak = streak;
        }

        // 本週完成任務數（done 欄位）
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Mon
        startOfWeek.setHours(0, 0, 0, 0);

        const doneThisWeek = tasks.filter((t) => {
            if (t.column !== "done") return false;
            const updated = new Date(t.updated_at);
            return updated >= startOfWeek;
        }).length;

        // 待辦（today + this_week）
        const pending = tasks.filter(
            (t) => t.column === "today" || t.column === "this_week"
        ).length;

        return {
            completedToday,
            totalHabits: habits.length,
            maxStreak,
            doneThisWeek,
            pending,
        };
    }, [habits, logs, tasks]);

    if (loading) {
        return (
            <div className="overview-stats">
                <div className="stat-card skeleton" />
                <div className="stat-card skeleton" />
                <div className="stat-card skeleton" />
                <div className="stat-card skeleton" />
            </div>
        );
    }

    const cards = [
        {
            icon: "🎯",
            label: "今日習慣",
            value: stats.totalHabits > 0
                ? `${stats.completedToday}/${stats.totalHabits}`
                : "—",
            accent: stats.completedToday === stats.totalHabits && stats.totalHabits > 0,
        },
        {
            icon: "🔥",
            label: "最長 Streak",
            value: stats.maxStreak > 0 ? `${stats.maxStreak} 天` : "—",
            accent: stats.maxStreak >= 7,
        },
        {
            icon: "✅",
            label: "本週完成",
            value: `${stats.doneThisWeek} 個`,
            accent: false,
        },
        {
            icon: "📋",
            label: "待辦",
            value: `${stats.pending} 個`,
            accent: stats.pending > 5,
        },
    ];

    return (
        <div className="overview-stats">
            {cards.map((card, i) => (
                <div key={i} className={`stat-card ${card.accent ? "accent" : ""}`}>
                    <span className="stat-icon">{card.icon}</span>
                    <div className="stat-content">
                        <span className="stat-value">{card.value}</span>
                        <span className="stat-label">{card.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
