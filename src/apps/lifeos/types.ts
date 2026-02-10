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

// F.L.O.W. Types
export type FlowType = "F" | "L" | "O" | "W" | "NONE";

export const FLOW_CONFIG: Record<FlowType, { label: string; color: string; zh: string }> = {
  F: { label: "Funnel", color: "#6366F1", zh: "策略規劃" },
  L: { label: "Leverage", color: "#0EA5E9", zh: "資產建造" },
  O: { label: "Operate", color: "#F59E0B", zh: "日常營運" },
  W: { label: "Wealth", color: "#16A34A", zh: "變現結果" },
  NONE: { label: "None", color: "#94A3B8", zh: "生活瑣事" },
};

// Task Types
export interface Task {
  id: string;
  title: string;
  description: string;
  column: "backlog" | "this_week" | "today" | "done";
  priority: number;
  due_date?: string;
  tags: string;
  flow_type: FlowType;
  order: number;
  completed_at?: string;
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
  flow_type?: FlowType;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: number;
  due_date?: string;
  tags?: string;
  flow_type?: FlowType;
}

export interface MoveTaskRequest {
  column: string;
  order?: number;
}

// Reminder Types
export type ReminderType = "HABIT_DAILY" | "TASK_DUE_SOON" | "TASK_OVERDUE";

export interface ReminderSetting {
  id: string;
  type: ReminderType;
  enabled: boolean;
  reminder_time: string; // HH:MM
  lead_days: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateReminderRequest {
  enabled?: boolean;
  reminder_time?: string;
  lead_days?: number;
}

// Skincare Types
export interface SkincareCycleSetting {
  id: string;
  cycle_start_date: string; // YYYY-MM-DD
  cycle_length: number;
  created_at: string;
  updated_at: string;
}

export interface SkincareStep {
  product: string;
  badge?: string;
  optional?: boolean;
}

export interface SkincareRoutine {
  cycle_day: number;
  phase: "menstrual" | "follicular" | "ovulation" | "luteal";
  phase_label: string;
  mode: string;
  day_of_week: string;
  date: string;
  am: SkincareStep[];
  pm: SkincareStep[];
  banned: string[];
}

export interface CycleStatusResponse {
  configured: boolean;
  cycle?: SkincareCycleSetting;
}

export interface UpdateCycleRequest {
  cycle_start_date: string;
  cycle_length?: number;
}

export interface SkincareScheduleRule {
  id: string;
  product_key: string;
  phase: string;
  weekdays: string; // "Tuesday,Friday"
  max_per_week: number;
  label: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateScheduleRuleRequest {
  product_key: string;
  phase: string;
  weekdays: string;
}
