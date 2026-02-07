import { useMemo } from "react";
import type { Habit, HabitLog } from "../types";
import "./HabitHeatmap.css";

interface HabitHeatmapProps {
    logs: Record<string, HabitLog[]>;
    habits: Habit[];
}

const WEEKS = 16;
const DAYS = 7;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getColorLevel(count: number): string {
    if (count === 0) return "level-0";
    if (count === 1) return "level-1";
    if (count === 2) return "level-2";
    return "level-3";
}

function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

export function HabitHeatmap({ logs, habits }: HabitHeatmapProps) {
    // 合併所有習慣的 Done logs，按日期計算完成數
    const { dateMap, cells, monthLabels } = useMemo(() => {
        // 1. 合併所有 Done logs → dateMap[YYYY-MM-DD] = count
        const map: Record<string, number> = {};
        for (const habitId of Object.keys(logs)) {
            for (const log of logs[habitId]) {
                if (log.status === "Done") {
                    map[log.date] = (map[log.date] || 0) + 1;
                }
            }
        }

        // 2. 產生 WEEKS × 7 grid cells（從今天往回推）
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 找到本週日（週日為起點）
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - dayOfWeek)); // 推到週六

        const totalDays = WEEKS * DAYS;
        const startDate = new Date(endOfWeek);
        startDate.setDate(endOfWeek.getDate() - totalDays + 1);

        const gridCells: { date: string; count: number; dayOfWeek: number; weekIndex: number }[] = [];

        for (let i = 0; i < totalDays; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = formatDate(d);
            const isFuture = d > today;
            gridCells.push({
                date: dateStr,
                count: isFuture ? -1 : (map[dateStr] || 0),
                dayOfWeek: d.getDay(),
                weekIndex: Math.floor(i / 7),
            });
        }

        // 3. 月份標籤
        const labels: { text: string; weekIndex: number }[] = [];
        let lastMonth = -1;
        for (let w = 0; w < WEEKS; w++) {
            const cellIndex = w * 7;
            if (cellIndex < gridCells.length) {
                const d = new Date(gridCells[cellIndex].date);
                const month = d.getMonth();
                if (month !== lastMonth) {
                    labels.push({
                        text: d.toLocaleString("en", { month: "short" }),
                        weekIndex: w,
                    });
                    lastMonth = month;
                }
            }
        }

        return { dateMap: map, cells: gridCells, monthLabels: labels };
    }, [logs]);

    if (habits.length === 0) return null;

    // 計算統計
    const totalDone = Object.values(dateMap).reduce((sum, c) => sum + c, 0);
    const activeDays = Object.keys(dateMap).length;

    return (
        <div className="habit-heatmap">
            <div className="heatmap-header">
                <h3>打卡紀錄</h3>
                <span className="heatmap-stats">
                    {activeDays} 天活躍 · {totalDone} 次打卡
                </span>
            </div>

            {/* 月份標籤 */}
            <div className="heatmap-months">
                <div className="heatmap-day-spacer" />
                <div className="heatmap-month-labels">
                    {monthLabels.map((label, i) => (
                        <span
                            key={i}
                            className="month-label"
                            style={{ gridColumnStart: label.weekIndex + 1 }}
                        >
                            {label.text}
                        </span>
                    ))}
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="heatmap-body">
                {/* Day labels (Mon/Wed/Fri) */}
                <div className="heatmap-day-labels">
                    {DAY_LABELS.map((label, i) => (
                        <span key={i} className="day-label">{label}</span>
                    ))}
                </div>

                {/* Grid */}
                <div className="heatmap-grid">
                    {cells.map((cell, i) => (
                        <div
                            key={i}
                            className={`heatmap-cell ${cell.count < 0 ? "future" : getColorLevel(cell.count)}`}
                            title={cell.count < 0 ? "" : `${cell.date}：${cell.count} 次完成`}
                        />
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="heatmap-legend">
                <span className="legend-text">Less</span>
                <div className="heatmap-cell level-0" />
                <div className="heatmap-cell level-1" />
                <div className="heatmap-cell level-2" />
                <div className="heatmap-cell level-3" />
                <span className="legend-text">More</span>
            </div>
        </div>
    );
}
