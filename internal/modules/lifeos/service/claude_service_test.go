package service

import (
	"strings"
	"testing"

	"nexus/internal/modules/lifeos/model"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func strPtr(v string) *string { return &v }

// --- determineDynamicSections ---

func TestDetermineDynamicSections_NoFlags(t *testing.T) {
	sections := determineDynamicSections(nil)
	assert.Equal(t, []string{"飲食建議"}, sections)
}

func TestDetermineDynamicSections_TrainingFlags(t *testing.T) {
	flags := []RuleFlag{
		{RuleID: "deep_sleep_insufficient", Severity: "high"},
	}
	sections := determineDynamicSections(flags)
	assert.Contains(t, sections, "飲食建議")
	assert.Contains(t, sections, "訓練調整")
}

func TestDetermineDynamicSections_RecoveryFlags(t *testing.T) {
	flags := []RuleFlag{
		{RuleID: "hrv_declining", Severity: "medium"},
	}
	sections := determineDynamicSections(flags)
	assert.Contains(t, sections, "飲食建議")
	assert.Contains(t, sections, "恢復策略")
	assert.NotContains(t, sections, "訓練調整")
}

func TestDetermineDynamicSections_MoodFlags(t *testing.T) {
	flags := []RuleFlag{
		{RuleID: "low_mood", Severity: "medium"},
	}
	sections := determineDynamicSections(flags)
	assert.Contains(t, sections, "心理調適")
}

func TestDetermineDynamicSections_LongTermFlags(t *testing.T) {
	flags := []RuleFlag{
		{RuleID: "vo2_max_declining", Severity: "low"},
	}
	sections := determineDynamicSections(flags)
	assert.Contains(t, sections, "長期策略")
}

func TestDetermineDynamicSections_MultipleTypes(t *testing.T) {
	flags := []RuleFlag{
		{RuleID: "deep_sleep_insufficient", Severity: "high"},
		{RuleID: "hrv_declining", Severity: "medium"},
		{RuleID: "low_mood", Severity: "medium"},
		{RuleID: "weight_trending_up", Severity: "low"},
	}
	sections := determineDynamicSections(flags)
	assert.Contains(t, sections, "飲食建議")
	assert.Contains(t, sections, "訓練調整")
	assert.Contains(t, sections, "恢復策略")
	assert.Contains(t, sections, "心理調適")
	assert.Contains(t, sections, "長期策略")
}

// --- buildWellnessPromptV2 ---

func TestBuildWellnessPromptV2_FullContext(t *testing.T) {
	m7Sleep := 7.2
	m30Sleep := 7.0
	m7HRV := 45.0
	m30HRV := 55.0

	ctx := WellnessContextV2{
		CycleDay:   14,
		CyclePhase: "ovulation",
		PhaseLabel: "排卵期",
		Today: &model.HealthSnapshot{
			Date:               "2026-03-12",
			SleepHours:         floatPtr(7.5),
			DeepSleepHours:     floatPtr(0.8),
			HRV:                floatPtr(42),
			RestingHR:          floatPtr(58),
			Weight:             floatPtr(55.2),
			BodyFat:            floatPtr(28.5),
			Steps:              floatPtr(8500),
			ActiveCalories:     floatPtr(320),
			RespiratoryRate:    floatPtr(15),
			WristTempDeviation: floatPtr(0.2),
			VO2Max:             floatPtr(38),
			MoodScore:          floatPtr(7),
			MoodLabel:          strPtr("good"),
		},
		Stats: HealthStatsSummary{
			SleepHours: MetricStats{Mean7d: &m7Sleep, Mean30d: &m30Sleep, Trend7d: "stable"},
			HRV:        MetricStats{Mean7d: &m7HRV, Mean30d: &m30HRV, Trend7d: "declining"},
		},
		Flags: []RuleFlag{
			{RuleID: "deep_sleep_insufficient", Message: "深睡不足（< 1 小時），不建議高強度訓練", Severity: "high"},
			{RuleID: "hrv_declining", Message: "HRV 7 日均值較 30 日下降超過 15%", Severity: "medium"},
		},
	}

	prompt := buildWellnessPromptV2(ctx)

	// Verify all sections present
	assert.Contains(t, prompt, "## 今日數據")
	assert.Contains(t, prompt, "## 7日/30日趨勢")
	assert.Contains(t, prompt, "## 觸發警報")
	assert.Contains(t, prompt, "## 請回答以下區塊")

	// Verify compact format (pipes)
	assert.Contains(t, prompt, "|")

	// Verify cycle info
	assert.Contains(t, prompt, "第 14 天")
	assert.Contains(t, prompt, "排卵期")

	// Verify dynamic sections based on flags
	assert.Contains(t, prompt, "訓練調整")
	assert.Contains(t, prompt, "恢復策略")
}

func TestBuildWellnessPromptV2_NilToday(t *testing.T) {
	ctx := WellnessContextV2{
		CycleDay:   5,
		CyclePhase: "follicular",
		PhaseLabel: "濾泡期",
		Today:      nil,
	}
	prompt := buildWellnessPromptV2(ctx)
	assert.Contains(t, prompt, "無今日數據")
}

func TestBuildWellnessPromptV2_NoFlags(t *testing.T) {
	ctx := WellnessContextV2{
		CycleDay:   5,
		CyclePhase: "follicular",
		PhaseLabel: "濾泡期",
		Today:      &model.HealthSnapshot{Date: "2026-03-12"},
		Flags:      nil,
	}
	prompt := buildWellnessPromptV2(ctx)
	assert.Contains(t, prompt, "無異常警報")
	assert.Contains(t, prompt, "飲食建議（必答）")
	// Should NOT contain training/recovery sections
	assert.NotContains(t, prompt, "訓練調整")
	assert.NotContains(t, prompt, "恢復策略")
}

func TestBuildWellnessPromptV2_TrainingFlags(t *testing.T) {
	ctx := WellnessContextV2{
		CycleDay:   10,
		CyclePhase: "follicular",
		PhaseLabel: "濾泡期",
		Today:      &model.HealthSnapshot{Date: "2026-03-12"},
		Flags: []RuleFlag{
			{RuleID: "chronic_sleep_deficit", Message: "連續 3 天睡眠不足", Severity: "high"},
		},
	}
	prompt := buildWellnessPromptV2(ctx)
	assert.Contains(t, prompt, "訓練調整")
	assert.Contains(t, prompt, "chronic_sleep_deficit")
}

func TestBuildWellnessPromptV2_MultipleFlagTypes(t *testing.T) {
	ctx := WellnessContextV2{
		CycleDay:   20,
		CyclePhase: "luteal",
		PhaseLabel: "黃體期",
		Today:      &model.HealthSnapshot{Date: "2026-03-12"},
		Flags: []RuleFlag{
			{RuleID: "respiratory_rate_spike", Message: "呼吸率異常偏高", Severity: "high"},
			{RuleID: "elevated_temperature", Message: "體溫偏高", Severity: "medium"},
			{RuleID: "low_mood", Message: "心理狀態低落", Severity: "medium"},
			{RuleID: "vo2_max_declining", Message: "有氧適能下降趨勢", Severity: "low"},
		},
	}
	prompt := buildWellnessPromptV2(ctx)
	assert.Contains(t, prompt, "訓練調整")
	assert.Contains(t, prompt, "恢復策略")
	assert.Contains(t, prompt, "心理調適")
	assert.Contains(t, prompt, "長期策略")
}

// --- parseWellnessAdviceV2 ---

func TestParseWellnessAdviceV2_ValidJSON(t *testing.T) {
	raw := `{"sections": [{"title": "飲食建議", "content": "多喝水"}, {"title": "訓練調整", "content": "降低強度"}]}`
	sections := parseWellnessAdviceV2(raw)
	require.Len(t, sections, 2)
	assert.Equal(t, "飲食建議", sections[0].Title)
	assert.Equal(t, "多喝水", sections[0].Content)
	assert.Equal(t, "訓練調整", sections[1].Title)
	assert.Equal(t, "降低強度", sections[1].Content)
}

func TestParseWellnessAdviceV2_MarkdownWrapped(t *testing.T) {
	raw := "```json\n{\"sections\": [{\"title\": \"飲食建議\", \"content\": \"吃清淡\"}]}\n```"
	sections := parseWellnessAdviceV2(raw)
	require.Len(t, sections, 1)
	assert.Equal(t, "飲食建議", sections[0].Title)
	assert.Equal(t, "吃清淡", sections[0].Content)
}

func TestParseWellnessAdviceV2_InvalidJSON(t *testing.T) {
	raw := "這是一段普通文字建議，不是 JSON。"
	sections := parseWellnessAdviceV2(raw)
	require.Len(t, sections, 1)
	assert.Equal(t, "綜合建議", sections[0].Title)
	assert.Equal(t, raw, sections[0].Content)
}

// --- Token budget check ---

func TestBuildWellnessPromptV2_TokenBudget(t *testing.T) {
	m7 := 7.0
	m30 := 6.8

	ctx := WellnessContextV2{
		CycleDay:   14,
		CyclePhase: "ovulation",
		PhaseLabel: "排卵期",
		Today: &model.HealthSnapshot{
			Date:               "2026-03-12",
			SleepHours:         floatPtr(7.5),
			DeepSleepHours:     floatPtr(1.2),
			HRV:                floatPtr(55),
			RestingHR:          floatPtr(58),
			Weight:             floatPtr(55.0),
			BodyFat:            floatPtr(28.0),
			Steps:              floatPtr(10000),
			ActiveCalories:     floatPtr(400),
			RespiratoryRate:    floatPtr(15),
			WristTempDeviation: floatPtr(0.1),
			VO2Max:             floatPtr(38),
			MoodScore:          floatPtr(7),
			MoodLabel:          strPtr("good"),
		},
		Stats: HealthStatsSummary{
			SleepHours: MetricStats{Mean7d: &m7, Mean30d: &m30, Trend7d: "stable"},
			HRV:        MetricStats{Mean7d: &m7, Mean30d: &m30, Trend7d: "stable"},
		},
		Flags: []RuleFlag{
			{RuleID: "deep_sleep_insufficient", Message: "深睡不足", Severity: "high"},
			{RuleID: "hrv_declining", Message: "HRV 下降", Severity: "medium"},
		},
	}

	prompt := buildWellnessPromptV2(ctx)
	// Rough token estimate: ~1 token per 2 CJK chars or ~4 English chars
	// 600 tokens ≈ ~2400 chars max (generous estimate for mixed CJK/ASCII)
	charCount := len([]rune(prompt))
	t.Logf("Prompt rune count: %d", charCount)
	assert.Less(t, charCount, 2400, "Prompt should be under ~600 tokens (rough char count check)")
}

// --- buildSystemInstructionV2 ---

func TestBuildSystemInstructionV2(t *testing.T) {
	inst := buildSystemInstructionV2()
	assert.Contains(t, inst, "JSON")
	assert.Contains(t, inst, "sections")
	assert.True(t, len(inst) > 0)
}

// --- trend arrow helper ---

func TestTrendArrow(t *testing.T) {
	assert.Equal(t, " ↑", trendArrow("rising"))
	assert.Equal(t, " ↓", trendArrow("declining"))
	assert.Equal(t, "", trendArrow("stable"))
	assert.Equal(t, "", trendArrow("insufficient_data"))
}

// --- severity label helper ---

func TestSeverityLabel(t *testing.T) {
	assert.True(t, strings.HasPrefix(severityLabel("high"), "[HIGH]"))
	assert.True(t, strings.HasPrefix(severityLabel("medium"), "[MEDIUM]"))
	assert.True(t, strings.HasPrefix(severityLabel("low"), "[LOW]"))
}
