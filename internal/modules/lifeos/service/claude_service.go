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

// WellnessContext - 傳給 Claude 的健康背景資料
type WellnessContext struct {
	CycleDay   int
	CyclePhase string
	PhaseLabel string
	Snapshot   *model.HealthSnapshot
}

// WellnessAdvice - Claude 回傳的建議
type WellnessAdvice struct {
	DietAdvice     string
	ExerciseAdvice string
	RawResponse    string
}

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

// GenerateWellnessAdvice 呼叫 Gemini API 生成飲食與運動建議
// 若 GEMINI_API_KEY 未設定，回傳 nil, nil（graceful skip）
func GenerateWellnessAdvice(ctx WellnessContext) (*WellnessAdvice, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Println("[Gemini] GEMINI_API_KEY not set, skipping wellness advice")
		return nil, nil
	}

	prompt := buildWellnessPrompt(ctx)

	reqBody := geminiRequest{
		SystemInstruction: &geminiContent{
			Parts: []geminiPart{{Text: "你是 Tamina 的個人健康顧問。根據她的生理週期與健康數據，給出具體可執行的飲食與運動建議。避免泛泛而談，以繁體中文回答。"}},
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
	diet, exercise := parseWellnessAdvice(rawText)

	return &WellnessAdvice{
		DietAdvice:     diet,
		ExerciseAdvice: exercise,
		RawResponse:    rawText,
	}, nil
}

// buildWellnessPrompt 組裝送給 Claude 的 prompt
func buildWellnessPrompt(ctx WellnessContext) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("今天是我的生理週期第 %d 天，目前處於%s。\n\n", ctx.CycleDay, ctx.PhaseLabel))

	if ctx.Snapshot != nil {
		sb.WriteString("昨天的健康數據：\n")
		if ctx.Snapshot.SleepHours != nil {
			sb.WriteString(fmt.Sprintf("- 睡眠時數：%.1f 小時\n", *ctx.Snapshot.SleepHours))
		}
		if ctx.Snapshot.HRV != nil {
			sb.WriteString(fmt.Sprintf("- HRV：%.0f ms\n", *ctx.Snapshot.HRV))
		}
		if ctx.Snapshot.RestingHR != nil {
			sb.WriteString(fmt.Sprintf("- 靜止心率：%.0f bpm\n", *ctx.Snapshot.RestingHR))
		}
		if ctx.Snapshot.ActiveCalories != nil {
			sb.WriteString(fmt.Sprintf("- 活動消耗：%.0f kcal\n", *ctx.Snapshot.ActiveCalories))
		}
		if ctx.Snapshot.WorkoutType != nil && ctx.Snapshot.WorkoutMinutes != nil {
			sb.WriteString(fmt.Sprintf("- 運動：%s %.0f 分鐘\n", *ctx.Snapshot.WorkoutType, *ctx.Snapshot.WorkoutMinutes))
		}
		if ctx.Snapshot.Weight != nil {
			sb.WriteString(fmt.Sprintf("- 體重：%.1f kg\n", *ctx.Snapshot.Weight))
		}
		if ctx.Snapshot.BodyFat != nil {
			sb.WriteString(fmt.Sprintf("- 體脂率：%.1f%%\n", *ctx.Snapshot.BodyFat))
		}
		if ctx.Snapshot.Steps != nil {
			sb.WriteString(fmt.Sprintf("- 步數：%.0f 步\n", *ctx.Snapshot.Steps))
		}
		sb.WriteString("\n")
	} else {
		sb.WriteString("今日尚無健康數據，請依據週期相位給予建議。\n\n")
	}

	sb.WriteString("請根據以上資訊，給我今天的建議，格式如下：\n\n")
	sb.WriteString("飲食建議：\n（2-3 句，具體可執行）\n\n")
	sb.WriteString("運動建議：\n（2-3 句，具體可執行）")

	return sb.String()
}

// parseWellnessAdvice 嘗試從 Claude 回應中切分飲食與運動建議
func parseWellnessAdvice(raw string) (diet, exercise string) {
	lower := strings.ToLower(raw)

	dietIdx := strings.Index(lower, "飲食建議")
	exerciseIdx := strings.Index(lower, "運動建議")

	if dietIdx == -1 || exerciseIdx == -1 {
		// 無法解析，全部放入 diet
		return strings.TrimSpace(raw), ""
	}

	if dietIdx < exerciseIdx {
		diet = strings.TrimSpace(raw[dietIdx+len("飲食建議"):exerciseIdx])
		exercise = strings.TrimSpace(raw[exerciseIdx+len("運動建議"):])
	} else {
		exercise = strings.TrimSpace(raw[exerciseIdx+len("運動建議"):dietIdx])
		diet = strings.TrimSpace(raw[dietIdx+len("飲食建議"):])
	}

	// 清除開頭的冒號/換行
	diet = strings.TrimLeft(diet, "：:\n ")
	exercise = strings.TrimLeft(exercise, "：:\n ")

	return diet, exercise
}
