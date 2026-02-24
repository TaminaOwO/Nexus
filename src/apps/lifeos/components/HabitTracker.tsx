import { useState, useEffect } from "react";
import { fetchHabits, fetchHabitLogs, checkHabit, createHabit, updateHabit, deleteHabit, freezeHabit } from "../api";
import type { Habit, HabitLog } from "../types";
import { HabitHeatmap } from "./HabitHeatmap";
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

    // Modal state
    const [showHabitModal, setShowHabitModal] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [saving, setSaving] = useState(false);
    const [habitForm, setHabitForm] = useState({
        name: "",
        frequency: "Daily",
        target_streak: 21,
        freeze_cards: 0,
        icon: "",
        color: "#CC7A60",
    });

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
            .filter((log) => log.status === "Done" || log.status === "Frozen")
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

    async function handleUseFreezeCard(habitId: string) {
        const today = new Date().toISOString().split("T")[0];
        try {
            setSaving(true);
            await freezeHabit(habitId, today);
            await loadHabits();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to use freeze card");
        } finally {
            setSaving(false);
        }
    }

    // ========== CRUD Handlers ==========

    function openCreateHabit() {
        setEditingHabit(null);
        setHabitForm({ name: "", frequency: "Daily", target_streak: 21, freeze_cards: 0, icon: "", color: "#CC7A60" });
        setShowHabitModal(true);
    }

    function openEditHabit(habit: Habit) {
        setEditingHabit(habit);
        setHabitForm({
            name: habit.name,
            frequency: habit.frequency,
            target_streak: habit.target_streak,
            freeze_cards: habit.freeze_cards,
            icon: habit.icon,
            color: habit.color,
        });
        setShowHabitModal(true);
    }

    async function submitHabit() {
        if (!habitForm.name.trim()) return;
        setSaving(true);
        try {
            if (editingHabit) {
                await updateHabit(editingHabit.id, habitForm);
            } else {
                await createHabit(habitForm);
            }
            setShowHabitModal(false);
            await loadHabits();
        } catch (err) {
            setError(err instanceof Error ? err.message : "儲存失敗 Failed to save habit");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteHabit(habit: Habit) {
        if (!window.confirm(`確認刪除「${habit.name}」習慣？\nConfirm delete this habit?`)) return;
        try {
            await deleteHabit(habit.id);
            await loadHabits();
        } catch (err) {
            setError(err instanceof Error ? err.message : "刪除失敗 Failed to delete habit");
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
                    <button className="add-habit-btn" onClick={openCreateHabit}>+ 新增習慣</button>
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
                        >
                            <div className="checkbox-container" onClick={() => toggleHabit(habit.id)}>
                                <div className="hand-checkbox">
                                    {completed && <IconCheck className="check-icon" />}
                                </div>
                            </div>
                            <div className="habit-info" onClick={() => toggleHabit(habit.id)}>
                                <span className="habit-text">
                                    {habit.icon && <span className="habit-icon">{habit.icon}</span>}
                                    {habit.name}
                                </span>
                                <span className="habit-streak">
                                    {streak > 0 && "🔥 "}{streak} day streak
                                    {habit.freeze_cards > 0 && (
                                        <span className="freeze-badge" title={`${habit.freeze_cards} freeze cards left`}>
                                            ❄️ {habit.freeze_cards}
                                        </span>
                                    )}
                                </span>
                            </div>
                            {!compact && (
                                <div className="habit-actions">
                                    {!completed && habit.freeze_cards > 0 && (
                                        <button
                                            className="habit-action-btn freeze"
                                            onClick={(e) => { e.stopPropagation(); handleUseFreezeCard(habit.id); }}
                                            title="使用凍結卡 Use Freeze Card"
                                            disabled={saving}
                                        >
                                            ❄️
                                        </button>
                                    )}
                                    <button
                                        className="habit-action-btn edit"
                                        onClick={(e) => { e.stopPropagation(); openEditHabit(habit); }}
                                        title="編輯"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="habit-action-btn delete"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteHabit(habit); }}
                                        title="刪除"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                {habits.length === 0 && !compact && (
                    <div className="empty-habits">
                        還沒有習慣，點擊上方「+ 新增習慣」開始建立！
                    </div>
                )}
            </div>
            {compact && habits.length > 3 && (
                <div className="more-habits">+ {habits.length - 3} more habits...</div>
            )}

            {/* ========== Heatmap ========== */}
            {!compact && habits.length > 0 && (
                <HabitHeatmap logs={logs} habits={habits} />
            )}

            {/* ========== Habit Modal ========== */}
            {showHabitModal && (
                <div className="habit-modal-overlay" onClick={() => setShowHabitModal(false)}>
                    <div className="habit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingHabit ? "編輯習慣" : "新增習慣"}</h3>
                            <button className="modal-close" onClick={() => setShowHabitModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>習慣名稱 Name</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    value={habitForm.name}
                                    onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === "Enter") submitHabit(); }}
                                    placeholder="例：每日冥想 10 分鐘"
                                    autoFocus
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>頻率 Frequency</label>
                                    <select
                                        className="modern-input"
                                        value={habitForm.frequency}
                                        onChange={(e) => setHabitForm({ ...habitForm, frequency: e.target.value })}
                                    >
                                        <option value="Daily">每日 Daily</option>
                                        <option value="Weekly">每週 Weekly</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>目標連續天數</label>
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={habitForm.target_streak}
                                        onChange={(e) => setHabitForm({ ...habitForm, target_streak: parseInt(e.target.value) || 0 })}
                                        min={1}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>凍結卡數量 Freeze Cards</label>
                                    <input
                                        type="number"
                                        className="modern-input"
                                        value={habitForm.freeze_cards}
                                        onChange={(e) => setHabitForm({ ...habitForm, freeze_cards: parseInt(e.target.value) || 0 })}
                                        min={0}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>圖示 Icon</label>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        value={habitForm.icon}
                                        onChange={(e) => setHabitForm({ ...habitForm, icon: e.target.value })}
                                        placeholder="emoji e.g. 🧘"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>顏色 Color</label>
                                    <div className="color-picker-wrapper">
                                        <input
                                            type="color"
                                            className="color-input"
                                            value={habitForm.color}
                                            onChange={(e) => setHabitForm({ ...habitForm, color: e.target.value })}
                                        />
                                        <span className="color-value">{habitForm.color}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowHabitModal(false)}>
                                取消
                            </button>
                            <button
                                className="btn-primary"
                                onClick={submitHabit}
                                disabled={saving || !habitForm.name.trim()}
                            >
                                {saving ? "儲存中..." : editingHabit ? "更新" : "建立"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
