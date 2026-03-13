package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// HealthSnapshot - 每日健康快照
type HealthSnapshot struct {
	ID                 string    `gorm:"primaryKey" json:"id"`
	Date               string    `gorm:"uniqueIndex" json:"date"` // YYYY-MM-DD
	SleepHours         *float64  `json:"sleep_hours"`
	HRV                *float64  `json:"hrv"`
	RestingHR          *float64  `json:"resting_hr"`
	ActiveCalories     *float64  `json:"active_calories"`
	WorkoutSummary     *string   `json:"workout_summary"` // 自然語言摘要，由後端從 HealthWorkoutLog 生成
	Weight             *float64  `json:"weight"`
	BodyFat            *float64  `json:"body_fat"`            // 體脂率 %
	Steps              *float64  `json:"steps"`               // 步數
	MoodScore          *float64  `json:"mood_score"`          // 情緒分數 1-10
	MoodLabel          *string   `json:"mood_label"`          // 情緒標籤
	DeepSleepHours     *float64  `json:"deep_sleep_hours"`    // 深度睡眠時數
	RespiratoryRate    *float64  `json:"respiratory_rate"`    // 呼吸率
	VO2Max             *float64  `json:"vo2_max"`             // 最大攝氧量
	WristTempDeviation *float64  `json:"wrist_temp_deviation"` // 手腕溫度偏差
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

func (h *HealthSnapshot) BeforeCreate(tx *gorm.DB) error {
	if h.ID == "" {
		h.ID = uuid.New().String()
	}
	return nil
}
