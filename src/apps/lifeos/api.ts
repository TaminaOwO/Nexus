import type {
  Habit,
  HabitLog,
  CreateHabitRequest,
  CheckHabitRequest,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  FlowType,
  ReminderSetting,
  UpdateReminderRequest,
} from "./types";

const API_BASE = "/api/lifeos";

// ========== Habit API ==========

export async function fetchHabits(): Promise<Habit[]> {
  const res = await fetch(`${API_BASE}/habits`);
  if (!res.ok) throw new Error("Failed to fetch habits");
  return res.json();
}

export async function createHabit(data: CreateHabitRequest): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create habit");
  return res.json();
}

export async function updateHabit(id: string, data: Partial<CreateHabitRequest>): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update habit");
  return res.json();
}

export async function deleteHabit(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/habits/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete habit");
}

export async function fetchHabitLogs(habitId: string): Promise<HabitLog[]> {
  const res = await fetch(`${API_BASE}/habits/${habitId}/logs`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function checkHabit(habitId: string, data: CheckHabitRequest): Promise<HabitLog> {
  const res = await fetch(`${API_BASE}/habits/${habitId}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to check habit");
  return res.json();
}

// ========== Task API ==========

export async function fetchTasks(column?: string, flowType?: FlowType): Promise<Task[]> {
  const params = new URLSearchParams();
  if (column) params.set("column", column);
  if (flowType) params.set("flow_type", flowType);
  const qs = params.toString();
  const url = qs ? `${API_BASE}/tasks?${qs}` : `${API_BASE}/tasks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete task");
}

export async function moveTask(id: string, data: MoveTaskRequest): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to move task");
  return res.json();
}

// ========== Reminder API ==========

export async function fetchReminderSettings(): Promise<ReminderSetting[]> {
  const res = await fetch(`${API_BASE}/reminders`);
  if (!res.ok) throw new Error("Failed to fetch reminder settings");
  return res.json();
}

export async function updateReminderSetting(
  type: string,
  data: UpdateReminderRequest
): Promise<ReminderSetting> {
  const res = await fetch(`${API_BASE}/reminders/${type}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update reminder setting");
  return res.json();
}

export async function testReminderWebhook(): Promise<void> {
  const res = await fetch(`${API_BASE}/reminders/test`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to send test notification");
}
