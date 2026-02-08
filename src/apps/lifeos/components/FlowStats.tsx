import { useMemo } from "react";
import type { Task, FlowType } from "../types";
import { FLOW_CONFIG } from "../types";
import "./FlowStats.css";

const FLOW_TYPES_DISPLAY: FlowType[] = ["F", "L", "O", "W"];

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
    return d;
}

function formatWeekLabel(weekStart: Date): string {
    const m = weekStart.getMonth() + 1;
    const d = weekStart.getDate();
    return `${m}/${d}`;
}

interface FlowStatsProps {
    tasks: Task[];
}

export function FlowStats({ tasks }: FlowStatsProps) {
    const doneTasks = useMemo(() =>
        tasks.filter((t) => t.column === "done"),
        [tasks]
    );

    // Energy distribution: count per flow type (done tasks only)
    const distribution = useMemo(() => {
        const counts: Record<FlowType, number> = { F: 0, L: 0, O: 0, W: 0, NONE: 0 };
        for (const t of doneTasks) {
            const ft = (t.flow_type || "NONE") as FlowType;
            counts[ft] = (counts[ft] || 0) + 1;
        }
        return counts;
    }, [doneTasks]);

    // 4-week trend
    const weeklyTrend = useMemo(() => {
        const now = new Date();
        const currentWeekStart = getWeekStart(now);

        const weeks: { start: Date; label: string; counts: Record<FlowType, number>; total: number }[] = [];

        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(currentWeekStart);
            weekStart.setDate(currentWeekStart.getDate() - i * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            const counts: Record<FlowType, number> = { F: 0, L: 0, O: 0, W: 0, NONE: 0 };
            let total = 0;

            for (const t of doneTasks) {
                // Use completed_at, fallback to updated_at for legacy data
                const dateStr = t.completed_at || t.updated_at;
                const date = new Date(dateStr);
                if (date >= weekStart && date < weekEnd) {
                    const ft = (t.flow_type || "NONE") as FlowType;
                    counts[ft] = (counts[ft] || 0) + 1;
                    total++;
                }
            }

            weeks.push({
                start: weekStart,
                label: i === 0 ? "本週" : formatWeekLabel(weekStart),
                counts,
                total,
            });
        }

        return weeks;
    }, [doneTasks]);

    const totalDone = doneTasks.length;
    const maxWeekTotal = Math.max(...weeklyTrend.map((w) => w.total), 1);

    if (totalDone === 0) {
        return (
            <div className="flow-stats">
                <h3 className="flow-stats-title">F.L.O.W. 能量分佈</h3>
                <div className="flow-stats-empty">尚無完成任務</div>
            </div>
        );
    }

    return (
        <div className="flow-stats">
            <h3 className="flow-stats-title">F.L.O.W. 能量分佈</h3>

            {/* Energy Distribution Bar */}
            <div className="flow-distribution-bar">
                {FLOW_TYPES_DISPLAY.map((ft) => {
                    const count = distribution[ft];
                    if (count === 0) return null;
                    const pct = (count / totalDone) * 100;
                    return (
                        <div
                            key={ft}
                            className="flow-distribution-segment"
                            style={{
                                width: `${pct}%`,
                                background: FLOW_CONFIG[ft].color,
                            }}
                            title={`${ft}: ${count} (${pct.toFixed(0)}%)`}
                        />
                    );
                })}
                {distribution.NONE > 0 && (
                    <div
                        className="flow-distribution-segment"
                        style={{
                            width: `${(distribution.NONE / totalDone) * 100}%`,
                            background: FLOW_CONFIG.NONE.color,
                        }}
                        title={`None: ${distribution.NONE}`}
                    />
                )}
            </div>

            {/* Legend */}
            <div className="flow-legend">
                {FLOW_TYPES_DISPLAY.map((ft) => (
                    <div key={ft} className="flow-legend-item">
                        <span className="flow-legend-dot" style={{ background: FLOW_CONFIG[ft].color }} />
                        <span>{FLOW_CONFIG[ft].label}</span>
                        <span className="flow-legend-count">{distribution[ft]}</span>
                    </div>
                ))}
            </div>

            {/* 4-Week Trend */}
            <div className="flow-trend">
                <h4 className="flow-trend-title">4 週趨勢</h4>
                <div className="flow-trend-chart">
                    {weeklyTrend.map((week, i) => {
                        const barHeight = maxWeekTotal > 0
                            ? (week.total / maxWeekTotal) * 80
                            : 0;
                        return (
                            <div key={i} className="flow-trend-week">
                                <span className="flow-trend-count">{week.total || ""}</span>
                                <div
                                    className="flow-trend-bar"
                                    style={{ height: `${Math.max(barHeight, 4)}px` }}
                                >
                                    {FLOW_TYPES_DISPLAY.map((ft) => {
                                        const count = week.counts[ft];
                                        if (count === 0 || week.total === 0) return null;
                                        const segPct = (count / week.total) * 100;
                                        return (
                                            <div
                                                key={ft}
                                                className="flow-trend-segment"
                                                style={{
                                                    height: `${segPct}%`,
                                                    background: FLOW_CONFIG[ft].color,
                                                }}
                                            />
                                        );
                                    })}
                                    {week.counts.NONE > 0 && week.total > 0 && (
                                        <div
                                            className="flow-trend-segment"
                                            style={{
                                                height: `${(week.counts.NONE / week.total) * 100}%`,
                                                background: FLOW_CONFIG.NONE.color,
                                            }}
                                        />
                                    )}
                                </div>
                                <span className="flow-trend-label">{week.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
