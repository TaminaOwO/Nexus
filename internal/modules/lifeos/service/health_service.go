package service

import (
	"errors"
	"fmt"
	"strings"

	"nexus/internal/database"
	"nexus/internal/modules/lifeos/model"
	"gorm.io/gorm"
)

// HealthSnapshotInput - 來自 iOS 捷徑的資料（所有欄位可選）
type HealthSnapshotInput struct {
	Date           string          `json:"date" binding:"required"`
	SleepHours     *float64        `json:"sleep_hours"`
	HRV            *float64        `json:"hrv"`
	RestingHR      *float64        `json:"resting_hr"`
	ActiveCalories *float64        `json:"active_calories"`
	Workouts       []WorkoutEntry  `json:"workouts"` // 結構化運動記錄
	Weight         *float64        `json:"weight"`
	BodyFat        *float64        `json:"body_fat"`
	Steps          *float64        `json:"steps"`
}

// WorkoutEntry - 單筆運動記錄
type WorkoutEntry struct {
	Type    string  `json:"type"`
	Minutes float64 `json:"minutes"`
}

// buildWorkoutSummary 把結構化運動記錄轉成自然語言摘要
func buildWorkoutSummary(workouts []WorkoutEntry) *string {
	if len(workouts) == 0 {
		return nil
	}
	parts := make([]string, 0, len(workouts))
	for _, w := range workouts {
		parts = append(parts, fmt.Sprintf("%s %.0f 分鐘", w.Type, w.Minutes))
	}
	s := strings.Join(parts, "、")
	return &s
}

// saveWorkoutLogs 刪除舊記錄後寫入新的結構化運動記錄
func saveWorkoutLogs(date string, workouts []WorkoutEntry) error {
	database.DB.Where("snapshot_date = ?", date).Delete(&model.HealthWorkoutLog{})
	for _, w := range workouts {
		log := model.HealthWorkoutLog{
			SnapshotDate: date,
			WorkoutType:  w.Type,
			Minutes:      w.Minutes,
		}
		if err := database.DB.Create(&log).Error; err != nil {
			return err
		}
	}
	return nil
}

// UpsertHealthSnapshot 建立或更新指定日期的健康快照
func UpsertHealthSnapshot(input HealthSnapshotInput) (*model.HealthSnapshot, error) {
	workoutSummary := buildWorkoutSummary(input.Workouts)

	var existing model.HealthSnapshot
	err := database.DB.Where("date = ?", input.Date).First(&existing).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		snap := model.HealthSnapshot{
			Date:           input.Date,
			SleepHours:     input.SleepHours,
			HRV:            input.HRV,
			RestingHR:      input.RestingHR,
			ActiveCalories: input.ActiveCalories,
			WorkoutSummary: workoutSummary,
			Weight:         input.Weight,
			BodyFat:        input.BodyFat,
			Steps:          input.Steps,
		}
		if err := database.DB.Create(&snap).Error; err != nil {
			return nil, err
		}
		if err := saveWorkoutLogs(input.Date, input.Workouts); err != nil {
			return nil, err
		}
		return &snap, nil
	} else if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"sleep_hours":     input.SleepHours,
		"hrv":             input.HRV,
		"resting_hr":      input.RestingHR,
		"active_calories": input.ActiveCalories,
		"workout_summary": workoutSummary,
		"weight":          input.Weight,
		"body_fat":        input.BodyFat,
		"steps":           input.Steps,
	}
	if err := database.DB.Model(&existing).Updates(updates).Error; err != nil {
		return nil, err
	}
	if err := saveWorkoutLogs(input.Date, input.Workouts); err != nil {
		return nil, err
	}
	return &existing, nil
}

// GetLatestSnapshot 取得最新一筆健康快照（按 date 排序）
func GetLatestSnapshot() (*model.HealthSnapshot, error) {
	var snap model.HealthSnapshot
	err := database.DB.Order("date DESC").First(&snap).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &snap, err
}

// GetRecentSnapshots 取得最近 N 天的健康快照
func GetRecentSnapshots(days int) ([]model.HealthSnapshot, error) {
	var snaps []model.HealthSnapshot
	err := database.DB.Order("date DESC").Limit(days).Find(&snaps).Error
	return snaps, err
}

// SaveWellnessRecommendation 儲存 AI 建議
func SaveWellnessRecommendation(rec *model.WellnessRecommendation) error {
	return database.DB.Create(rec).Error
}
