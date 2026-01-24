import { useState, useEffect } from "react";
import { fetchTasks } from "../api";
import type { Task } from "../types";
import "./TodoBoard.css";

export function TodoBoard({ compact = false }: { compact?: boolean }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {
        try {
            setLoading(true);
            const data = await fetchTasks();
            setTasks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tasks");
        } finally {
            setLoading(false);
        }
    }

    const columns = [
        { id: "backlog", title: "Backlog", color: "var(--text-secondary)" },
        { id: "this_week", title: "This Week", color: "var(--accent)" },
        { id: "today", title: "Today", color: "var(--primary)" },
        { id: "done", title: "Done", color: "var(--success)" },
    ];

    const displayColumns = compact
        ? columns.filter((c) => c.id === "today" || c.id === "this_week")
        : columns;

    if (loading) return <div className="todo-board">Loading...</div>;
    if (error) return <div className="todo-board error">{error}</div>;

    return (
        <div className={`todo-board ${compact ? "compact" : ""}`}>
            <div className="board-grid">
                {displayColumns.map((col) => (
                    <div key={col.id} className="board-column">
                        <div className="column-header">
                            <h3 style={{ color: col.color }}>{col.title}</h3>
                            <span className="count">
                                {tasks.filter((t) => t.column === col.id).length}
                            </span>
                        </div>
                        <div className="task-list">
                            {tasks
                                .filter((t) => t.column === col.id)
                                .sort((a, b) => a.order - b.order)
                                .map((task) => (
                                    <div key={task.id} className="task-card">
                                        <div className="task-text">{task.title}</div>
                                        {task.tags && <div className="task-tag">{task.tags}</div>}
                                    </div>
                                ))}
                            {compact && tasks.filter((t) => t.column === col.id).length === 0 && (
                                <div className="empty-state">No tasks</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
