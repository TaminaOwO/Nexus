## Why

Nexus 目前只在早晨推送保養步驟，缺乏對身體狀態的感知。透過整合 iOS Health 資料，系統可以在每日早安通知時，依據客觀健康數據（睡眠、HRV、靜止心率、運動、體重、步數、體脂率）自動生成個人化飲食與運動建議，免除手動回報的摩擦，並保留結構化歷史資料供長期分析。

## What Changes

- 新增 `POST /api/lifeos/health/sync` API，接收來自 iOS 捷徑推送的每日健康快照
- 新增 `HealthSnapshot` DB 實體，儲存每日健康數據（含體脂率、步數）
- 新增 `HealthWorkoutLog` DB 實體，結構化儲存每日多筆運動記錄（類型 + 時長），供歷史分析
- 運動資料由 iOS 捷徑序列化為 JSON 字串傳入，後端解析後同時：(1) 寫入 `HealthWorkoutLog` 供分析；(2) 轉為自然語言供 AI prompt 使用
- 擴展早安 cron job：結合經期週期 + 健康快照 → 呼叫 Gemini API → 生成飲食與運動建議
- 將 Gemini 生成的建議儲存至 DB（`WellnessRecommendation` 實體）
- 早安 Discord 通知擴展：在保養步驟後加上 AI 生成的健康建議區塊

## Capabilities

### New Capabilities
- `health-snapshot`: iOS Health 資料同步 API 與每日健康快照儲存（睡眠、HRV、靜止心率、體重、體脂率、步數）；運動記錄以 JSON 字串傳入並解析為結構化 `HealthWorkoutLog`
- `morning-wellness-ai`: 早安 cron 整合 Gemini AI，依週期相位 + 健康快照生成飲食與運動建議，推送至 Discord 並存入 DB

### Modified Capabilities
- `lifeos`: 新增三個 DB 實體（HealthSnapshot、HealthWorkoutLog、WellnessRecommendation）需加入 AutoMigrate；早安 reminder scanner 擴展呼叫 Gemini API

## Impact

- **Go 後端**：`internal/modules/lifeos/` 新增 health handler / service / claude_service；`service/reminder_scanner.go` 擴展早安邏輯；`cmd/server/main.go` 加入 AutoMigrate 與路由
- **環境變數**：新增 `GEMINI_API_KEY`（取代原 ANTHROPIC_API_KEY 方案）
- **DB Schema**：新增 `health_snapshots`、`health_workout_logs`、`wellness_recommendations` 三張資料表
- **iOS 捷徑**：新增每日排程捷徑，從 Health App 讀取昨日數據，運動記錄序列化為 JSON 字串，POST 至 Nexus API（date 填昨天日期）
- **Discord**：早安通知訊息格式擴展，加入 AI 建議區塊
- **無前端變更**：此功能為後端 + 外部整合，不需 React UI
