package model

import (
	"time"
)

// Task - 任務看板
type Task struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Column      string    `json:"column"`   // backlog / this_week / today / done
	Priority    int       `json:"priority"` // 1-3
	DueDate     *string   `json:"due_date"`
	Tags        string    `json:"tags"`
	Order       int       `json:"order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateTaskRequest - 新增任務 API 請求
type CreateTaskRequest struct {
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description"`
	Column      string  `json:"column" binding:"required"`
	Priority    int     `json:"priority"`
	DueDate     *string `json:"due_date"`
	Tags        string  `json:"tags"`
}

// UpdateTaskRequest - 更新任務 API 請求
type UpdateTaskRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Priority    int     `json:"priority"`
	DueDate     *string `json:"due_date"`
	Tags        string  `json:"tags"`
}

// MoveTaskRequest - 移動任務欄位 API 請求
type MoveTaskRequest struct {
	Column string `json:"column" binding:"required"`
	Order  int    `json:"order"`
}
