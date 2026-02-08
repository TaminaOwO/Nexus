package model

import (
	"time"
)

// Task - 任務看板
type Task struct {
	ID          string     `gorm:"primaryKey" json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Column      string     `json:"column"`   // backlog / this_week / today / done
	Priority    int        `json:"priority"` // 1-3
	DueDate     *string    `json:"due_date"`
	Tags        string     `json:"tags"`
	FlowType    string     `gorm:"default:NONE" json:"flow_type"` // F / L / O / W / NONE
	Order       int        `json:"order"`
	CompletedAt *time.Time `json:"completed_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// CreateTaskRequest - 新增任務 API 請求
type CreateTaskRequest struct {
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description"`
	Column      string  `json:"column" binding:"required"`
	Priority    int     `json:"priority"`
	DueDate     *string `json:"due_date"`
	Tags        string  `json:"tags"`
	FlowType    string  `json:"flow_type"`
}

// UpdateTaskRequest - 更新任務 API 請求
type UpdateTaskRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Priority    int     `json:"priority"`
	DueDate     *string `json:"due_date"`
	Tags        string  `json:"tags"`
	FlowType    *string `json:"flow_type"`
}

// MoveTaskRequest - 移動任務欄位 API 請求
type MoveTaskRequest struct {
	Column string `json:"column" binding:"required"`
	Order  int    `json:"order"`
}
