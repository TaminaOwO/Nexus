## Context

Nexus LifeOS 模組已有早安保養通知（reminder_scanner.go），以及透過 iOS 捷徑同步經期資料的機制。本設計擴展現有基礎設施，新增 iOS Health 每日快照同步，並整合 Claude AI 生成個人化健康建議。

現況限制：
- Discord Webhook 為單向推播，無法互動回覆
- iOS 捷徑已知可存取 Health App 資料並 POST 至 Nexus API
- 無現有 Claude API 整合

## Goals / Non-Goals

**Goals:**
- 每日自動從 iOS Health 取得睡眠、HRV、靜止心率、運動、體重數據
- 結合經期週期相位與健康數據，呼叫 Claude API 生成飲食與運動建議
- 將建議附加至早安 Discord 通知中
- 儲存所有健康快照與 AI 建議至 DB（供長期追蹤）

**Non-Goals:**
- 前端 UI（此版本純後端推播）
- 多用戶支援
- 即時健康警報
- 取代現有的 skincare/cycle 捷徑

## Decisions

### Decision 1：Claude API 呼叫放在哪一層？

**決策**：放在 `service/reminder_scanner.go` 的早安觸發流程中，作為保養建議之後的一個步驟。

**理由**：
- reminder_scanner 已是所有早安邏輯的協調者
- 保持模組隔離，不需新增獨立 scheduler
- 失敗時可 graceful degrade（跳過 AI 建議，僅推送保養內容）

**替代方案**：獨立 cron job → 增加複雜度且與現有早安通知的時序難以協調

---

### Decision 2：HealthSnapshot 資料模型

**決策**：新增 `HealthSnapshot` struct，欄位為可選（pointer types），允許 iOS 捷徑只傳可取得的欄位：

```go
type HealthSnapshot struct {
    ID             string     `gorm:"primaryKey"`
    Date           string     `json:"date"` // YYYY-MM-DD, unique
    SleepHours     *float64   `json:"sleep_hours"`
    HRV            *float64   `json:"hrv"`
    RestingHR      *float64   `json:"resting_hr"`
    ActiveCalories *float64   `json:"active_calories"`
    WorkoutType    *string    `json:"workout_type"`
    WorkoutMinutes *float64   `json:"workout_minutes"`
    Weight         *float64   `json:"weight"`
    CreatedAt      time.Time
    UpdatedAt      time.Time
}
```

Date 欄位加 unique constraint（每日只存一筆，iOS 捷徑 upsert）。

---

### Decision 3：WellnessRecommendation 儲存

**決策**：每次 AI 呼叫結果儲存至 `WellnessRecommendation` 表，欄位：`Date`、`Prompt`（縮短版）、`DietAdvice`、`ExerciseAdvice`、`RawResponse`。

**理由**：
- 長期追蹤 AI 建議品質與趨勢
- 除錯用（可查看送給 Claude 的完整 prompt）
- 未來前端 UI 可讀取

---

### Decision 4：Claude Prompt 設計

送給 Claude 的 context 包含：
1. 今日週期相位（menstrual/follicular/ovulation/luteal）
2. 昨晚睡眠、HRV、靜止心率
3. 近期運動記錄（最近 7 天）
4. 當前體重（若有）
5. 請求格式：以繁體中文回答，分「飲食建議」與「運動建議」兩段，各 2-3 句，實用簡潔

System prompt 設定 Claude 為「個人健康顧問，依據數據給具體可執行建議，避免泛泛而談」。

---

### Decision 5：失敗處理策略

**決策**：Claude API 呼叫失敗時，早安通知仍正常發送（不含 AI 建議區塊），error log 記錄但不阻斷流程。HealthSnapshot 同步失敗時回傳 400/500，iOS 捷徑可設重試。

---

### Decision 6：ANTHROPIC_API_KEY 管理

**決策**：透過環境變數 `ANTHROPIC_API_KEY` 注入，本地用 `.env`，Railway 設定 env var。不硬編碼。

## Risks / Trade-offs

- **API 費用**：每日一次 Claude API 呼叫，單一用戶成本極低（估計 < $0.01/day）→ 可接受
- **iOS 捷徑依賴**：若使用者某天未執行捷徑，當日無健康數據 → AI 建議降級為「無今日健康數據」提示，仍可依週期相位給基本建議
- **HRV/睡眠數據準確性**：Apple Watch 數據偶有缺失 → pointer 欄位設計允許部分數據缺失
- **Claude 回應格式不穩定**：若 Claude 未按格式回應 → 存入 RawResponse，Discord 仍顯示完整回應，不做嚴格 parse

## Migration Plan

1. 新增 `HealthSnapshot`、`WellnessRecommendation` 到 AutoMigrate → GORM 自動建表
2. 部署時設定 `ANTHROPIC_API_KEY` 環境變數
3. iOS 捷徑需使用者手動安裝（提供設定說明）
4. Rollback：移除環境變數即停用 AI 功能（graceful degrade）

## Open Questions

- Claude API 呼叫是否需要 rate limit / retry 機制？（目前每日一次，應不需要）
- iOS 捷徑應讀取昨日完整數據還是「過去 24 小時」？（建議昨日，因捷徑在早晨執行）
