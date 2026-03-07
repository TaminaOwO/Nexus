package service

import (
	"errors"

	"nexus/internal/database"
	"nexus/internal/modules/lifeos/model"
	"gorm.io/gorm"
)

// HealthSnapshotInput - 來自 iOS 捷徑的資料（所有欄位可選）
type HealthSnapshotInput struct {
	Date           string   `json:"date" binding:"required"`
	SleepHours     *float64 `json:"sleep_hours"`
	HRV            *float64 `json:"hrv"`
	RestingHR      *float64 `json:"resting_hr"`
	ActiveCalories *float64 `json:"active_calories"`
	WorkoutType    *string  `json:"workout_type"`
	WorkoutMinutes *float64 `json:"workout_minutes"`
	Weight         *float64 `json:"weight"`
	MoodScore      *float64 `json:"mood_score"`
	MoodLabel      *string  `json:"mood_label"`
}

// UpsertHealthSnapshot 建立或更新指定日期的健康快照
func UpsertHealthSnapshot(input HealthSnapshotInput) (*model.HealthSnapshot, error) {
	var existing model.HealthSnapshot
	err := database.DB.Where("date = ?", input.Date).First(&existing).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// 新建
		snap := model.HealthSnapshot{
			Date:           input.Date,
			SleepHours:     input.SleepHours,
			HRV:            input.HRV,
			RestingHR:      input.RestingHR,
			ActiveCalories: input.ActiveCalories,
			WorkoutType:    input.WorkoutType,
			WorkoutMinutes: input.WorkoutMinutes,
			Weight:         input.Weight,
			MoodScore:      input.MoodScore,
			MoodLabel:      input.MoodLabel,
		}
		if err := database.DB.Create(&snap).Error; err != nil {
			return nil, err
		}
		return &snap, nil
	} else if err != nil {
		return nil, err
	}

	// 更新
	updates := map[string]interface{}{
		"sleep_hours":     input.SleepHours,
		"hrv":             input.HRV,
		"resting_hr":      input.RestingHR,
		"active_calories": input.ActiveCalories,
		"workout_type":    input.WorkoutType,
		"workout_minutes": input.WorkoutMinutes,
		"weight":          input.Weight,
		"mood_score":      input.MoodScore,
		"mood_label":      input.MoodLabel,
	}
	if err := database.DB.Model(&existing).Updates(updates).Error; err != nil {
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
