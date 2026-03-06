package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SkincareCycleSetting - 週期設定（DB 只存一筆）
type SkincareCycleSetting struct {
	ID             string    `gorm:"primaryKey" json:"id"`
	CycleStartDate string    `json:"cycle_start_date"` // YYYY-MM-DD (Day 1)
	CycleLength    int       `json:"cycle_length"`      // 預設 28
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (s *SkincareCycleSetting) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

// SkincareRoutine - 每日保養建議（純計算，不存 DB）
type SkincareRoutine struct {
	CycleDay   int            `json:"cycle_day"`
	Phase      string         `json:"phase"`       // menstrual / follicular / ovulation / luteal
	PhaseLabel string         `json:"phase_label"` // 中文
	Mode       string         `json:"mode"`        // Rest & Repair / Glow but Controlled / ...
	DayOfWeek  string         `json:"day_of_week"` // Monday...
	Date       string         `json:"date"`        // YYYY-MM-DD
	AM         []SkincareStep `json:"am"`
	PM         []SkincareStep `json:"pm"`
	Banned     []string       `json:"banned"`
}

// SkincareStep - 單一保養步驟
type SkincareStep struct {
	Product  string `json:"product"`
	Badges   []string `json:"badges,omitempty"`
	Optional bool   `json:"optional,omitempty"`
}

// UpdateCycleRequest - 更新週期設定
type UpdateCycleRequest struct {
	CycleStartDate string `json:"cycle_start_date" binding:"required"`
	CycleLength    int    `json:"cycle_length"`
}

// SkincareScheduleRule - 產品使用日排程（可自訂）
type SkincareScheduleRule struct {
	ID         string    `gorm:"primaryKey" json:"id"`
	ProductKey string    `gorm:"uniqueIndex:idx_prod_phase" json:"product_key"` // retinol, boj_eye
	Phase      string    `gorm:"uniqueIndex:idx_prod_phase" json:"phase"`       // follicular, luteal
	Weekdays   string    `json:"weekdays"`                                       // "Tuesday,Friday"
	MaxPerWeek int       `json:"max_per_week"`
	Label      string    `json:"label"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (r *SkincareScheduleRule) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}

// BatchUpdateScheduleRequest - 批次更新排程
type BatchUpdateScheduleRequest struct {
	Rules []UpdateScheduleRuleRequest `json:"rules" binding:"required"`
}

type UpdateScheduleRuleRequest struct {
	ProductKey string `json:"product_key" binding:"required"`
	Phase      string `json:"phase" binding:"required"`
	Weekdays   string `json:"weekdays" binding:"required"`
}
