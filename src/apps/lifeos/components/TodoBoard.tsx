import { useState } from "react";
import "./TodoBoard.css";

interface Task {
    id: string;
    text: string;
    status: 'todo' | 'doing' | 'done';
    tag?: string;
}

const INITIAL_TASKS: Task[] = [
    { id: '1', text: "Refactor Kite Module", status: 'done', tag: 'Dev' },
    { id: '2', text: "Design LifeOS Dashboard", status: 'doing', tag: 'Design' },
    { id: '3', text: "Write Weekly Report", status: 'todo', tag: 'Work' },
    { id: '4', text: "Call Mom", status: 'todo', tag: 'Personal' },
];

export function TodoBoard({ compact = false }: { compact?: boolean }) {
    const [tasks, _setTasks] = useState(INITIAL_TASKS);

    const columns = [
        { id: 'todo', title: 'To Do', color: 'var(--text-secondary)' },
        { id: 'doing', title: 'In Progress', color: 'var(--accent)' },
        { id: 'done', title: 'Done', color: 'var(--success)' },
    ];

    const displayColumns = compact
        ? columns.filter(c => c.id === 'doing' || c.id === 'todo')
        : columns;

    return (
        <div className={`todo-board ${compact ? 'compact' : ''}`}>
            <div className="board-grid">
                {displayColumns.map(col => (
                    <div key={col.id} className="board-column">
                        <div className="column-header">
                            <h3 style={{ color: col.color }}>{col.title}</h3>
                            <span className="count">
                                {tasks.filter(t => t.status === col.id).length}
                            </span>
                        </div>
                        <div className="task-list">
                            {tasks
                                .filter(t => t.status === col.id)
                                .map(task => (
                                    <div key={task.id} className="task-card">
                                        <div className="task-text">{task.text}</div>
                                        {task.tag && (
                                            <div className="task-tag">{task.tag}</div>
                                        )}
                                    </div>
                                ))}
                            {compact && tasks.filter(t => t.status === col.id).length === 0 && (
                                <div className="empty-state">No tasks</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
