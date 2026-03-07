## 1. DB Models & Migration

- [x] 1.1 建立 `internal/modules/lifeos/model/health_snapshot.go`：定義 `HealthSnapshot` struct（UUID PK、date unique、所有健康欄位 pointer type）
- [x] 1.2 建立 `internal/modules/lifeos/model/wellness_recommendation.go`：定義 `WellnessRecommendation` struct（UUID PK、date、cycle_phase、diet_advice、exercise_advice、raw_response）
- [x] 1.3 在 `cmd/server/main.go` 的 `AutoMigrate` 中加入 `&model.HealthSnapshot{}` 與 `&model.WellnessRecommendation{}`
- [x] 1.4 確認 `go build ./cmd/server` 通過

## 2. Health Snapshot API

- [x] 2.1 建立 `internal/modules/lifeos/service/health_service.go`：實作 `UpsertHealthSnapshot(date string, data HealthSnapshotInput) error` 與 `GetLatestSnapshot() (*HealthSnapshot, error)`
- [x] 2.2 建立 `internal/modules/lifeos/handler/health_handler.go`：實作 `SyncHealthSnapshot`（POST handler，解析 JSON body，呼叫 service upsert）與 `GetLatestHealthSnapshot`（GET handler）
- [x] 2.3 在 `cmd/server/main.go` 路由中加入 `POST /api/lifeos/health/sync` 與 `GET /api/lifeos/health/latest`
- [ ] 2.4 手動測試：curl POST 帶完整 body → 200；curl POST 缺少 date → 400；curl GET latest → 200

## 3. Claude AI 整合

- [x] 3.1 建立 `internal/modules/lifeos/service/claude_service.go`：實作 `GenerateWellnessAdvice(ctx WellnessContext) (*WellnessAdvice, error)`，讀取 `ANTHROPIC_API_KEY` 環境變數；key 不存在時直接回傳 nil, nil
- [x] 3.2 在 `claude_service.go` 中實作 prompt 建構邏輯：組合週期相位、健康數據（略過 nil 欄位）、請求 Claude 以繁體中文回答，分「飲食建議」與「運動建議」
- [x] 3.3 使用 `net/http` 直接呼叫 Anthropic Messages API（`https://api.anthropic.com/v1/messages`），model: `claude-haiku-4-5-20251001`，timeout: 30s
- [x] 3.4 Claude API 回應解析：擷取 `content[0].text`，嘗試切分飲食/運動兩段；若無法解析則整體存入 raw_response

## 4. Reminder Scanner 整合

- [x] 4.1 在 `internal/modules/lifeos/service/reminder_scanner.go` 的早安觸發邏輯中，於 skincare 通知組裝後，呼叫 `GetLatestSnapshot()` 取得今日健康數據
- [x] 4.2 呼叫 `GenerateWellnessAdvice()` 組裝建議；呼叫失敗或回傳 nil 時跳過（不阻斷）
- [x] 4.3 若取得建議，呼叫 service 將結果存入 `wellness_recommendations` 表
- [x] 4.4 擴展 Discord 訊息組裝：在保養步驟後附加 wellness 區塊（若有），格式含「飲食建議」與「運動建議」兩段
- [x] 4.5 確認 `go build ./cmd/server` 通過

## 5. 驗證

- [ ] 5.1 設定 `ANTHROPIC_API_KEY` 環境變數，啟動 server，手動觸發 reminder scan，確認 Discord 收到含 AI 建議的訊息
- [x] 5.2 清除 `ANTHROPIC_API_KEY`，重啟 server，手動觸發，確認 Discord 僅收到保養內容（無 AI 區塊）
- [ ] 5.3 確認 `health_snapshots` 與 `wellness_recommendations` 兩張資料表在 DB 中存在且可寫入
