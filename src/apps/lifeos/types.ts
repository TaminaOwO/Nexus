// Habit Types
export interface Habit {
  id: string;
  name: string;
  frequency: string;
  target_streak: number;
  icon: string;
  color: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  status: "Done" | "Skipped" | "Missed";
  created_at: string;
}

export interface CreateHabitRequest {
  name: string;
  frequency: string;
  target_streak?: number;
  icon?: string;
  color?: string;
}

export interface CheckHabitRequest {
  date: string; // YYYY-MM-DD
  status: "Done" | "Skipped";
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description: string;
  column: "backlog" | "this_week" | "today" | "done";
  priority: number;
  due_date?: string;
  tags: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  column: string;
  priority?: number;
  due_date?: string;
  tags?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: number;
  due_date?: string;
  tags?: string;
}

export interface MoveTaskRequest {
  column: string;
  order?: number;
}
