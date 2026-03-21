import { useState, useEffect } from "react";
import { fetchTasks, createTask, updateTask, deleteTask, moveTask } from "../api";
import type { Task, CreateTaskRequest, UpdateTaskRequest, FlowType } from "../types";
import { FLOW_CONFIG } from "../types";
import "./TodoBoard.css";

const COLUMN_ORDER = ["backlog", "this_week", "today", "done"];

const columns = [
    { id: "backlog", title: "Backlog", color: "var(--text-secondary, #64748B)" },
    { id: "this_week", title: "This Week", color: "var(--accent, #CC7A60)" },
    { id: "today", title: "Today", color: "var(--primary, #0F172A)" },
    { id: "done", title: "Done", color: "var(--success, #16A34A)" },
];

export function TodoBoard({ compact = false }: { compact?: boolean }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [saving, setSaving] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: "",
        description: "",
        column: "backlog",
        priority: 2,
        due_date: "",
        tags: "",
        flow_type: "NONE" as FlowType,
    });

    // Quick-add state
    const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
    const [quickAddTitle, setQuickAddTitle] = useState("");

    // Drag & Drop state
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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

    // ========== CRUD Handlers ==========

    function openCreateTask(column: string = "backlog") {
        setEditingTask(null);
        setTaskForm({
            title: "",
            description: "",
            column,
            priority: 2,
            due_date: "",
            tags: "",
            flow_type: "NONE",
        });
        setShowTaskModal(true);
    }

    function openEditTask(task: Task) {
        setEditingTask(task);
        setTaskForm({
            title: task.title,
            description: task.description || "",
            column: task.column,
            priority: task.priority,
            due_date: task.due_date || "",
            tags: task.tags || "",
            flow_type: task.flow_type || "NONE",
        });
        setShowTaskModal(true);
    }

    async function submitTask() {
        if (!taskForm.title.trim()) return;
        setSaving(true);
        try {
            if (editingTask) {
                const updateData: UpdateTaskRequest = {
                    title: taskForm.title,
                    description: taskForm.description,
                    priority: taskForm.priority,
                    due_date: taskForm.due_date || undefined,
                    tags: taskForm.tags,
                    flow_type: taskForm.flow_type,
                };
                await updateTask(editingTask.id, updateData);

                // If column changed, also move
                if (taskForm.column !== editingTask.column) {
                    await moveTask(editingTask.id, { column: taskForm.column });
                }
            } else {
                const createData: CreateTaskRequest = {
                    title: taskForm.title,
                    description: taskForm.description || undefined,
                    column: taskForm.column,
                    priority: taskForm.priority,
                    due_date: taskForm.due_date || undefined,
                    tags: taskForm.tags || undefined,
                    flow_type: taskForm.flow_type,
                };
                await createTask(createData);
            }
            setShowTaskModal(false);
            await loadTasks();
        } catch (err) {
            setError(err instanceof Error ? err.message : "儲存失敗 Failed to save task");
        } finally {
            setSaving(false);
        }
    }

    async function handleQuickAdd(column: string) {
        if (!quickAddTitle.trim()) return;
        try {
            await createTask({ title: quickAddTitle.trim(), column });
            setQuickAddTitle("");
            setQuickAddColumn(null);
            await loadTasks();
        } catch (err) {
            setError(err instanceof Error ? err.message : "新增失敗 Failed to add task");
        }
    }

    async function handleDeleteTask(task: Task) {
        if (!window.confirm(`確認刪除「${task.title}」任務？\nConfirm delete this task?`)) return;
        try {
            await deleteTask(task.id);
            await loadTasks();
        } catch (err) {
            setError(err instanceof Error ? err.message : "刪除失敗 Failed to delete task");
        }
    }

    async function handleMoveTask(task: Task, direction: "left" | "right") {
        const currentIndex = COLUMN_ORDER.indexOf(task.column);
        const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= COLUMN_ORDER.length) return;

        try {
            await moveTask(task.id, { column: COLUMN_ORDER[newIndex] });
            await loadTasks();
        } catch (err) {
            setError(err instanceof Error ? err.message : "移動失敗 Failed to move task");
        }
    }

    // ========== Drag & Drop Handlers ==========

    async function handleDrop(targetColumn: string) {
        if (!draggedTask || draggedTask.column === targetColumn) {
            setDraggedTask(null);
            setDragOverColumn(null);
            return;
        }
        try {
            await moveTask(draggedTask.id, { column: targetColumn });
            await loadTasks();
        } catch (err) {
            setError(err instanceof Error ? err.message : "移動失敗 Failed to move task");
        } finally {
            setDraggedTask(null);
            setDragOverColumn(null);
        }
    }

    const displayColumns = compact
        ? columns.filter((c) => c.id === "today" || c.id === "this_week")
        : columns;

    if (loading) return <div className="todo-board">Loading...</div>;
    if (error) return <div className="todo-board error">{error}</div>;

    return (
        <div className={`todo-board ${compact ? "compact" : ""}`}>
            <div className="board-grid">
                {displayColumns.map((col) => {
                    const columnTasks = tasks
                        .filter((t) => t.column === col.id)
                        .sort((a, b) => a.order - b.order);

                    return (
                        <div
                            key={col.id}
                            className={`board-column ${dragOverColumn === col.id ? "drag-over" : ""}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.id); }}
                            onDragLeave={(e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null); }}
                            onDrop={(e) => { e.preventDefault(); handleDrop(col.id); }}
                        >
                            <div className="column-header">
                                <h3 style={{ color: col.color }}>{col.title}</h3>
                                <div className="column-header-actions">
                                    <span className="count">{columnTasks.length}</span>
                                    {!compact && (
                                        <button
                                            className="column-add-btn"
                                            onClick={() => setQuickAddColumn(quickAddColumn === col.id ? null : col.id)}
                                            title="快速新增"
                                        >
                                            +
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick-add inline input */}
                            {quickAddColumn === col.id && (
                                <div className="quick-add">
                                    <input
                                        type="text"
                                        className="quick-add-input"
                                        value={quickAddTitle}
                                        onChange={(e) => setQuickAddTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleQuickAdd(col.id);
                                            if (e.key === "Escape") { setQuickAddColumn(null); setQuickAddTitle(""); }
                                        }}
                                        placeholder="輸入任務名稱..."
                                        autoFocus
                                    />
                                    <div className="quick-add-actions">
                                        <button className="btn-quick-save" onClick={() => handleQuickAdd(col.id)}>
                                            新增
                                        </button>
                                        <button className="btn-quick-detail" onClick={() => { setQuickAddColumn(null); setQuickAddTitle(""); openCreateTask(col.id); }}>
                                            詳細
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="task-list">
                                {columnTasks.map((task) => {
                                    const colIdx = COLUMN_ORDER.indexOf(task.column);
                                    return (
                                        <div
                                            key={task.id}
                                            className={`task-card priority-${task.priority} ${draggedTask?.id === task.id ? "dragging" : ""}`}
                                            draggable={!compact}
                                            onDragStart={() => setDraggedTask(task)}
                                            onDragEnd={() => { setDraggedTask(null); setDragOverColumn(null); }}
                                            onClick={() => !compact && openEditTask(task)}
                                        >
                                            <div className="task-card-header">
                                                <div className="task-text">{task.title}</div>
                                                {!compact && (
                                                    <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
                                                        {colIdx > 0 && (
                                                            <button className="move-btn" onClick={() => handleMoveTask(task, "left")} title="向左移動">
                                                                ←
                                                            </button>
                                                        )}
                                                        {colIdx < COLUMN_ORDER.length - 1 && (
                                                            <button className="move-btn" onClick={() => handleMoveTask(task, "right")} title="向右移動">
                                                                →
                                                            </button>
                                                        )}
                                                        <button className="delete-btn-sm" onClick={() => handleDeleteTask(task)} title="刪除">
                                                            ✕
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="task-meta">
                                                {task.flow_type && task.flow_type !== "NONE" && (
                                                    <span
                                                        className="flow-badge"
                                                        style={{
                                                            background: `${FLOW_CONFIG[task.flow_type].color}18`,
                                                            color: FLOW_CONFIG[task.flow_type].color,
                                                        }}
                                                    >
                                                        {task.flow_type}
                                                    </span>
                                                )}
                                                {task.priority === 1 && <span className="priority-badge p1">!!!</span>}
                                                {task.priority === 3 && <span className="priority-badge p3">Low</span>}
                                                {task.due_date && <span className="due-date-badge">{task.due_date}</span>}
                                                {task.tags && <span className="task-tag">{task.tags}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {columnTasks.length === 0 && (
                                    <div className="empty-state">No tasks</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ========== Task Modal ========== */}
            {showTaskModal && (
                <div className="task-modal-overlay" onClick={() => setShowTaskModal(false)}>
                    <div className="task-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingTask ? "編輯任務" : "新增任務"}</h3>
                            <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>任務名稱 Title</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submitTask(); }}
                                    placeholder="例：完成 Q1 報告"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>描述 Description</label>
                                <textarea
                                    className="modern-input textarea"
                                    rows={3}
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    placeholder="選填：任務細節..."
                                />
                            </div>
                            <div className="form-group">
                                <label>F.L.O.W. 分類</label>
                                <div className="flow-selector">
                                    {(Object.keys(FLOW_CONFIG) as FlowType[]).map((ft) => (
                                        <button
                                            key={ft}
                                            type="button"
                                            className={`flow-option ${taskForm.flow_type === ft ? "selected" : ""}`}
                                            style={taskForm.flow_type === ft ? {
                                                background: `${FLOW_CONFIG[ft].color}18`,
                                                borderColor: FLOW_CONFIG[ft].color,
                                                color: FLOW_CONFIG[ft].color,
                                            } : undefined}
                                            onClick={() => setTaskForm({ ...taskForm, flow_type: ft })}
                                        >
                                            {ft === "NONE" ? "—" : ft}
                                            <span className="flow-option-label">{FLOW_CONFIG[ft].zh}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>欄位 Column</label>
                                    <select
                                        className="modern-input"
                                        value={taskForm.column}
                                        onChange={(e) => setTaskForm({ ...taskForm, column: e.target.value })}
                                    >
                                        <option value="backlog">Backlog</option>
                                        <option value="this_week">This Week</option>
                                        <option value="today">Today</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>優先度 Priority</label>
                                    <select
                                        className="modern-input"
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({ ...taskForm, priority: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>!!! 緊急</option>
                                        <option value={2}>一般</option>
                                        <option value={3}>低</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>到期日 Due Date</label>
                                    <input
                                        type="date"
                                        className="modern-input"
                                        value={taskForm.due_date}
                                        onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>標籤 Tags</label>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        value={taskForm.tags}
                                        onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
                                        placeholder="e.g. work, health"
                                    />
                                </div>
                            </div>
                            {editingTask && (
                                <div className="modal-delete-zone">
                                    <button
                                        className="btn-danger-outline"
                                        onClick={() => { setShowTaskModal(false); handleDeleteTask(editingTask); }}
                                    >
                                        刪除任務 Delete Task
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowTaskModal(false)}>
                                取消
                            </button>
                            <button
                                className="btn-primary"
                                onClick={submitTask}
                                disabled={saving || !taskForm.title.trim()}
                            >
                                {saving ? "儲存中..." : editingTask ? "更新" : "建立"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
