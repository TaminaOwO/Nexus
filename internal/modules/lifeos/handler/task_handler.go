package handler

import (
	"net/http"
	"nexus/internal/database"
	"nexus/internal/modules/lifeos/model"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetTasks - GET /api/lifeos/tasks
func GetTasks(c *gin.Context) {
	column := c.Query("column")

	query := database.DB.Order("`order` asc, created_at desc")

	if column != "" {
		query = query.Where("column = ?", column)
	}

	var tasks []model.Task
	query.Find(&tasks)
	c.JSON(http.StatusOK, tasks)
}

// CreateTask - POST /api/lifeos/tasks
func CreateTask(c *gin.Context) {
	var req model.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 自動計算 Order（同欄位最大值 + 1）
	var maxOrder int
	database.DB.Model(&model.Task{}).Where("column = ?", req.Column).Select("COALESCE(MAX(`order`), 0)").Scan(&maxOrder)

	task := model.Task{
		ID:          uuid.New().String(),
		Title:       req.Title,
		Description: req.Description,
		Column:      req.Column,
		Priority:    req.Priority,
		DueDate:     req.DueDate,
		Tags:        req.Tags,
		Order:       maxOrder + 1,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	result := database.DB.Create(&task)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, task)
}

// UpdateTask - PUT /api/lifeos/tasks/:id
func UpdateTask(c *gin.Context) {
	id := c.Param("id")

	var task model.Task
	if result := database.DB.First(&task, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	var req model.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Title != "" {
		task.Title = req.Title
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Priority > 0 {
		task.Priority = req.Priority
	}
	if req.DueDate != nil {
		task.DueDate = req.DueDate
	}
	if req.Tags != "" {
		task.Tags = req.Tags
	}

	task.UpdatedAt = time.Now()
	database.DB.Save(&task)
	c.JSON(http.StatusOK, task)
}

// DeleteTask - DELETE /api/lifeos/tasks/:id
func DeleteTask(c *gin.Context) {
	id := c.Param("id")

	result := database.DB.Delete(&model.Task{}, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
}

// MoveTask - PATCH /api/lifeos/tasks/:id/move
func MoveTask(c *gin.Context) {
	id := c.Param("id")

	var task model.Task
	if result := database.DB.First(&task, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	var req model.MoveTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task.Column = req.Column
	if req.Order > 0 {
		task.Order = req.Order
	}
	task.UpdatedAt = time.Now()

	database.DB.Save(&task)
	c.JSON(http.StatusOK, task)
}
