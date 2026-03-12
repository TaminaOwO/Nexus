package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"nexus/internal/modules/lifeos/model"
)

// Gemini API 請求結構
type geminiRequest struct {
	SystemInstruction *geminiContent  `json:"system_instruction,omitempty"`
	Contents          []geminiContent `json:"contents"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiResponse struct {
	Candidates []struct {
		Content geminiContent `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// ============================================================
// V2: Compressed context + dynamic output sections
// ============================================================

// WellnessSection represents a single advice section from AI response.
type WellnessSection struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// WellnessAdviceV2 holds structured AI wellness advice.
type WellnessAdviceV2 struct {
	Sections    []WellnessSection
	RawResponse string
}

// WellnessContextV2 holds compressed context for the V2 prompt.
type WellnessContextV2 struct {
	CycleDay   int
	CyclePhase string
	PhaseLabel string
	Today      *model.HealthSnapshot
	Stats      HealthStatsSummary
	Flags      []RuleFlag
}

// GenerateWellnessAdviceV2 calls Gemini API with compressed context and dynamic output sections.
// Returns nil, nil if GEMINI_API_KEY is not set (graceful skip).
func GenerateWellnessAdviceV2(ctx WellnessContextV2) (*WellnessAdviceV2, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Println("[Gemini] GEMINI_API_KEY not set, skipping wellness advice")
		return nil, nil
	}

	prompt := buildWellnessPromptV2(ctx)
	sysInstruction := buildSystemInstructionV2()

	reqBody := geminiRequest{
		SystemInstruction: &geminiContent{
			Parts: []geminiPart{{Text: sysInstruction}},
		},
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal gemini request: %w", err)
	}

	httpCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey
	req, err := http.NewRequestWithContext(httpCtx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create gemini request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gemini API call failed: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read gemini response: %w", err)
	}

	var geminiResp geminiResponse
	if err := json.Unmarshal(respBytes, &geminiResp); err != nil {
		return nil, fmt.Errorf("failed to parse gemini response: %w", err)
	}

	if geminiResp.Error != nil {
		return nil, fmt.Errorf("gemini API error: %s", geminiResp.Error.Message)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("gemini returned empty content")
	}

	rawText := geminiResp.Candidates[0].Content.Parts[0].Text
	sections := parseWellnessAdviceV2(rawText)

	return &WellnessAdviceV2{
		Sections:    sections,
		RawResponse: rawText,
	}, nil
}

// buildSystemInstructionV2 returns the fixed system instruction for V2 prompt.
func buildSystemInstructionV2() string {
	return "你是 Tamina 的個人健康顧問，專長運動科學與恢復管理。\n" +
		"根據健康數據、統計趨勢與觸發規則，給出具體可執行的建議。\n" +
		"繁體中文回答。簡潔有力，每個區塊 2-3 句。\n" +
		`回應必須為 JSON 格式：{"sections": [{"title": "區塊標題", "content": "建議內容"}]}`
}

// buildWellnessPromptV2 builds the compressed user prompt from context.
func buildWellnessPromptV2(ctx WellnessContextV2) string {
	var sb strings.Builder

	// Section 1: 今日快照
	buildSnapshotSection(&sb, ctx)

	// Section 2: 統計摘要
	buildStatsSection(&sb, ctx.Stats)

	// Section 3: 觸發警報
	buildFlagsSection(&sb, ctx.Flags)

	// Section 4: 動態輸出指令
	buildOutputInstructions(&sb, ctx.Flags)

	return sb.String()
}

// buildSnapshotSection writes the today's data snapshot in compact pipe-separated format.
func buildSnapshotSection(sb *strings.Builder, ctx WellnessContextV2) {
	if ctx.Today == nil {
		sb.WriteString("## 今日數據\n無今日數據，請依據週期相位給予建議。\n\n")
		return
	}

	sb.WriteString(fmt.Sprintf("## 今日數據 (%s)\n", ctx.Today.Date))
	sb.WriteString(fmt.Sprintf("週期：第 %d 天（%s）\n", ctx.CycleDay, ctx.PhaseLabel))

	// Build compact pipe-separated lines
	var line1, line2, line3 []string

	// Line 1: sleep + HRV + HR
	if ctx.Today.SleepHours != nil {
		line1 = append(line1, fmt.Sprintf("睡眠：%.1f hr", *ctx.Today.SleepHours))
	}
	if ctx.Today.DeepSleepHours != nil {
		line1 = append(line1, fmt.Sprintf("深睡：%.1f hr", *ctx.Today.DeepSleepHours))
	}
	if ctx.Today.HRV != nil {
		line1 = append(line1, fmt.Sprintf("HRV：%.0f ms", *ctx.Today.HRV))
	}
	if ctx.Today.RestingHR != nil {
		line1 = append(line1, fmt.Sprintf("靜止心率：%.0f bpm", *ctx.Today.RestingHR))
	}
	if len(line1) > 0 {
		sb.WriteString(strings.Join(line1, " | ") + "\n")
	}

	// Line 2: weight + body comp + activity
	if ctx.Today.Weight != nil {
		line2 = append(line2, fmt.Sprintf("體重：%.1f kg", *ctx.Today.Weight))
	}
	if ctx.Today.BodyFat != nil {
		line2 = append(line2, fmt.Sprintf("體脂：%.1f%%", *ctx.Today.BodyFat))
	}
	if ctx.Today.Steps != nil {
		line2 = append(line2, fmt.Sprintf("步數：%.0f", *ctx.Today.Steps))
	}
	if ctx.Today.ActiveCalories != nil {
		line2 = append(line2, fmt.Sprintf("活動消耗：%.0f kcal", *ctx.Today.ActiveCalories))
	}
	if len(line2) > 0 {
		sb.WriteString(strings.Join(line2, " | ") + "\n")
	}

	// Line 3: respiratory + temp + VO2 + mood
	if ctx.Today.RespiratoryRate != nil {
		line3 = append(line3, fmt.Sprintf("呼吸率：%.0f 次/分", *ctx.Today.RespiratoryRate))
	}
	if ctx.Today.WristTempDeviation != nil {
		line3 = append(line3, fmt.Sprintf("手腕溫度偏差：%+.1f°C", *ctx.Today.WristTempDeviation))
	}
	if ctx.Today.VO2Max != nil {
		line3 = append(line3, fmt.Sprintf("VO2 Max：%.0f", *ctx.Today.VO2Max))
	}
	if ctx.Today.MoodScore != nil {
		moodStr := fmt.Sprintf("心情：%.0f/10", *ctx.Today.MoodScore)
		if ctx.Today.MoodLabel != nil {
			moodStr += fmt.Sprintf(" (%s)", *ctx.Today.MoodLabel)
		}
		line3 = append(line3, moodStr)
	}
	if len(line3) > 0 {
		sb.WriteString(strings.Join(line3, " | ") + "\n")
	}

	sb.WriteString("\n")
}

// buildStatsSection writes the 7d/30d trend summary, skipping insufficient_data metrics.
func buildStatsSection(sb *strings.Builder, stats HealthStatsSummary) {
	sb.WriteString("## 7日/30日趨勢\n")

	type metricEntry struct {
		label string
		ms    MetricStats
		unit  string
	}

	metrics := []metricEntry{
		{"睡眠", stats.SleepHours, "hr"},
		{"HRV", stats.HRV, "ms"},
		{"靜止心率", stats.RestingHR, "bpm"},
		{"深睡", stats.DeepSleepHours, "hr"},
		{"呼吸率", stats.RespiratoryRate, "次/分"},
		{"VO2 Max", stats.VO2Max, ""},
		{"體溫偏差", stats.WristTempDev, "°C"},
		{"心情", stats.MoodScore, "/10"},
		{"體重", stats.Weight, "kg"},
		{"體脂", stats.BodyFat, "%"},
		{"步數", stats.Steps, ""},
		{"活動消耗", stats.ActiveCalories, "kcal"},
	}

	hasData := false
	for _, m := range metrics {
		if m.ms.Trend7d == "insufficient_data" || m.ms.Mean7d == nil {
			continue
		}
		hasData = true
		entry := fmt.Sprintf("%s：7d均 %.1f%s", m.label, *m.ms.Mean7d, m.unit)
		entry += fmt.Sprintf("%s", trendArrow(m.ms.Trend7d))
		if m.ms.Mean30d != nil {
			entry += fmt.Sprintf(" | 30d均 %.1f%s", *m.ms.Mean30d, m.unit)
		}
		sb.WriteString(entry + "\n")
	}

	if !hasData {
		sb.WriteString("數據不足\n")
	}
	sb.WriteString("\n")
}

// trendArrow returns a compact arrow for trend direction.
func trendArrow(trend string) string {
	switch trend {
	case "rising":
		return " ↑"
	case "declining":
		return " ↓"
	default:
		return ""
	}
}

// severityLabel returns the formatted severity prefix.
func severityLabel(severity string) string {
	switch severity {
	case "high":
		return "[HIGH]"
	case "medium":
		return "[MEDIUM]"
	case "low":
		return "[LOW]"
	default:
		return "[" + strings.ToUpper(severity) + "]"
	}
}

// buildFlagsSection writes triggered rule alerts.
func buildFlagsSection(sb *strings.Builder, flags []RuleFlag) {
	sb.WriteString("## 觸發警報\n")
	if len(flags) == 0 {
		sb.WriteString("無異常警報\n")
	} else {
		for _, f := range flags {
			sb.WriteString(fmt.Sprintf("%s %s\n", severityLabel(f.Severity), f.Message))
		}
	}
	sb.WriteString("\n")
}

// buildOutputInstructions writes dynamic output section directives based on triggered flags.
func buildOutputInstructions(sb *strings.Builder, flags []RuleFlag) {
	sections := determineDynamicSections(flags)

	sb.WriteString("## 請回答以下區塊\n")
	for i, s := range sections {
		if i == 0 {
			sb.WriteString(fmt.Sprintf("- %s（必答）\n", s))
		} else {
			// Find the triggering rule for this section
			trigger := findTriggerForSection(s, flags)
			if trigger != "" {
				sb.WriteString(fmt.Sprintf("- %s（因觸發：%s）\n", s, trigger))
			} else {
				sb.WriteString(fmt.Sprintf("- %s\n", s))
			}
		}
	}
}

// determineDynamicSections returns which output sections to request based on triggered flags.
func determineDynamicSections(flags []RuleFlag) []string {
	sections := []string{"飲食建議"}

	trainingRules := map[string]bool{
		"deep_sleep_insufficient": true,
		"respiratory_rate_spike":  true,
		"chronic_sleep_deficit":   true,
	}
	recoveryRules := map[string]bool{
		"hrv_declining":         true,
		"elevated_temperature":  true,
	}
	moodRules := map[string]bool{
		"low_mood": true,
	}
	longTermRules := map[string]bool{
		"vo2_max_declining":  true,
		"weight_trending_up": true,
	}

	hasTraining, hasRecovery, hasMood, hasLongTerm := false, false, false, false

	for _, f := range flags {
		if trainingRules[f.RuleID] {
			hasTraining = true
		}
		if recoveryRules[f.RuleID] {
			hasRecovery = true
		}
		if moodRules[f.RuleID] {
			hasMood = true
		}
		if longTermRules[f.RuleID] {
			hasLongTerm = true
		}
	}

	if hasTraining {
		sections = append(sections, "訓練調整")
	}
	if hasRecovery {
		sections = append(sections, "恢復策略")
	}
	if hasMood {
		sections = append(sections, "心理調適")
	}
	if hasLongTerm {
		sections = append(sections, "長期策略")
	}

	return sections
}

// findTriggerForSection finds the first rule ID that maps to a given output section.
func findTriggerForSection(section string, flags []RuleFlag) string {
	sectionToRules := map[string]map[string]bool{
		"訓練調整": {"deep_sleep_insufficient": true, "respiratory_rate_spike": true, "chronic_sleep_deficit": true},
		"恢復策略": {"hrv_declining": true, "elevated_temperature": true},
		"心理調適": {"low_mood": true},
		"長期策略": {"vo2_max_declining": true, "weight_trending_up": true},
	}

	rules, ok := sectionToRules[section]
	if !ok {
		return ""
	}

	for _, f := range flags {
		if rules[f.RuleID] {
			return f.RuleID
		}
	}
	return ""
}

// parseWellnessAdviceV2 parses the AI response JSON into WellnessSections.
// Falls back to a single "綜合建議" section if parsing fails.
func parseWellnessAdviceV2(raw string) []WellnessSection {
	cleaned := raw

	// Strip markdown code fences if present
	cleaned = strings.TrimSpace(cleaned)
	if strings.HasPrefix(cleaned, "```") {
		// Remove opening fence (```json or ```)
		if idx := strings.Index(cleaned, "\n"); idx != -1 {
			cleaned = cleaned[idx+1:]
		}
		// Remove closing fence
		if idx := strings.LastIndex(cleaned, "```"); idx != -1 {
			cleaned = cleaned[:idx]
		}
		cleaned = strings.TrimSpace(cleaned)
	}

	var result struct {
		Sections []WellnessSection `json:"sections"`
	}

	if err := json.Unmarshal([]byte(cleaned), &result); err != nil {
		return []WellnessSection{{Title: "綜合建議", Content: raw}}
	}

	if len(result.Sections) == 0 {
		return []WellnessSection{{Title: "綜合建議", Content: raw}}
	}

	return result.Sections
}
