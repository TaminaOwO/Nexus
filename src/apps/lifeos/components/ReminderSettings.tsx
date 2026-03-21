import { useState, useEffect } from "react";
import { fetchReminderSettings, updateReminderSetting, testReminderWebhook } from "../api";
import type { ReminderSetting, ReminderType } from "../types";
import "./ReminderSettings.css";

const REMINDER_CONFIG: Record<ReminderType, { icon: string; label: string; description: string; showLeadDays: boolean }> = {
    HABIT_DAILY: {
        icon: "🧠",
        label: "習慣打卡提醒",
        description: "每日提醒尚未完成的習慣打卡",
        showLeadDays: false,
    },
    TASK_DUE_SOON: {
        icon: "📋",
        label: "任務即將到期",
        description: "任務到期前提醒（可設定提前天數）",
        showLeadDays: true,
    },
    TASK_OVERDUE: {
        icon: "🚨",
        label: "逾期任務提醒",
        description: "每日彙報已過期但未完成的任務",
        showLeadDays: false,
    },
    SKINCARE_AM: {
        icon: "🌅",
        label: "早晨保養提醒",
        description: "每日早晨推送 AM 保養步驟清單",
        showLeadDays: false,
    },
    SKINCARE_PM: {
        icon: "🌙",
        label: "晚間保養提醒",
        description: "每日晚間推送 PM 保養步驟清單",
        showLeadDays: false,
    },
};

interface Props {
    onClose: () => void;
}

export function ReminderSettings({ onClose }: Props) {
    const [settings, setSettings] = useState<ReminderSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

    useEffect(() => {
        fetchReminderSettings()
            .then(setSettings)
            .catch(() => setStatus({ message: "無法載入提醒設定", isError: true }))
            .finally(() => setLoading(false));
    }, []);

    function getSettingByType(type: ReminderType): ReminderSetting | undefined {
        return settings.find(s => s.type === type);
    }

    async function handleToggle(type: ReminderType, enabled: boolean) {
        setSaving(type);
        setStatus(null);
        try {
            const updated = await updateReminderSetting(type, { enabled });
            setSettings(prev => {
                const exists = prev.find(s => s.type === type);
                if (exists) return prev.map(s => s.type === type ? updated : s);
                return [...prev, updated];
            });
        } catch {
            setStatus({ message: "更新失敗", isError: true });
        } finally {
            setSaving(null);
        }
    }

    async function handleTimeChange(type: ReminderType, reminderTime: string) {
        try {
            const updated = await updateReminderSetting(type, { reminder_time: reminderTime });
            setSettings(prev => {
                const exists = prev.find(s => s.type === type);
                if (exists) return prev.map(s => s.type === type ? updated : s);
                return [...prev, updated];
            });
        } catch {
            setStatus({ message: "更新失敗", isError: true });
        }
    }

    async function handleLeadDaysChange(type: ReminderType, leadDays: number) {
        try {
            const updated = await updateReminderSetting(type, { lead_days: leadDays });
            setSettings(prev => {
                const exists = prev.find(s => s.type === type);
                if (exists) return prev.map(s => s.type === type ? updated : s);
                return [...prev, updated];
            });
        } catch {
            setStatus({ message: "更新失敗", isError: true });
        }
    }

    async function handleTest() {
        setSaving("test");
        setStatus(null);
        try {
            await testReminderWebhook();
            setStatus({ message: "測試通知已發送至 Discord", isError: false });
        } catch {
            setStatus({ message: "發送失敗，請確認 Discord Webhook 設定", isError: true });
        } finally {
            setSaving(null);
        }
    }

    // Default values for display when no DB record
    const defaults: Record<ReminderType, { enabled: boolean; reminder_time: string; lead_days: number }> = {
        HABIT_DAILY: { enabled: true, reminder_time: "21:00", lead_days: 0 },
        TASK_DUE_SOON: { enabled: true, reminder_time: "09:00", lead_days: 1 },
        TASK_OVERDUE: { enabled: true, reminder_time: "09:00", lead_days: 0 },
        SKINCARE_AM: { enabled: true, reminder_time: "08:00", lead_days: 0 },
        SKINCARE_PM: { enabled: true, reminder_time: "18:00", lead_days: 0 },
    };

    const types: ReminderType[] = ["HABIT_DAILY", "TASK_DUE_SOON", "TASK_OVERDUE", "SKINCARE_AM", "SKINCARE_PM"];

    return (
        <div className="reminder-overlay" onClick={onClose}>
            <div className="reminder-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>提醒設定</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#94A3B8" }}>
                            載入中...
                        </div>
                    ) : (
                        types.map(type => {
                            const config = REMINDER_CONFIG[type];
                            const setting = getSettingByType(type);
                            const enabled = setting?.enabled ?? defaults[type].enabled;
                            const reminderTime = setting?.reminder_time ?? defaults[type].reminder_time;
                            const leadDays = setting?.lead_days ?? defaults[type].lead_days;

                            return (
                                <div key={type} className={`reminder-card ${!enabled ? "disabled" : ""}`}>
                                    <div className="reminder-card-header">
                                        <div className="reminder-card-title">
                                            <span className="reminder-icon">{config.icon}</span>
                                            <span className="reminder-label">{config.label}</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={enabled}
                                                disabled={saving === type}
                                                onChange={(e) => handleToggle(type, e.target.checked)}
                                            />
                                            <span className="toggle-slider" />
                                        </label>
                                    </div>
                                    <div className="reminder-card-desc">{config.description}</div>
                                    <div className="reminder-fields">
                                        <div className="reminder-field">
                                            <label>提醒時間</label>
                                            <input
                                                type="time"
                                                value={reminderTime}
                                                onChange={(e) => handleTimeChange(type, e.target.value)}
                                                disabled={!enabled}
                                            />
                                        </div>
                                        {config.showLeadDays && (
                                            <div className="reminder-field">
                                                <label>提前天數</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={7}
                                                    value={leadDays}
                                                    onChange={(e) => handleLeadDaysChange(type, parseInt(e.target.value) || 0)}
                                                    disabled={!enabled}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {status && (
                        <div className={`reminder-status ${status.isError ? "error" : ""}`}>
                            {status.message}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-test"
                        onClick={handleTest}
                        disabled={saving === "test"}
                    >
                        {saving === "test" ? "發送中..." : "測試通知"}
                    </button>
                    <button className="btn-close-modal" onClick={onClose}>
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
}
