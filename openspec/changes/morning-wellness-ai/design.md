# Morning Wellness AI v2 — Health Auto Export Integration

## Context

Nexus LifeOS 模組已有早安保養通知（reminder_scanner.go），以及透過 iOS 捷徑同步健康資料的機制（v1）。v1 因 iOS 捷徑設置繁瑣而暫停。

本設計將資料來源從 iOS Shortcuts 切換至第三方 app **Health Auto Export**，透過其原生 Webhook 功能自動推送健康數據至 Nexus。同時擴充指標、新增統計引擎與規則引擎，並優化 AI Token 使用效率。

### 現況（v1 已實作，在 main 上）

- `HealthSnapshot` / `HealthWorkoutLog` / `WellnessRecommendation` 三張表
- `POST /api/lifeos/health/sync` 接收 iOS Shortcuts JSON
- 每早 08:00 Gemini AI 生成飲食 + 運動建議 → Discord
- 所有欄位 nullable、upsert by date

### v1 → v2 變更摘要

| 項目 | v1 | v2 |
|------|----|----|
| 資料來源 | iOS Shortcuts | Health Auto Export Webhook |
| 認證 | Nexus auth middleware | X-API-Key middleware |
| 指標數 | 8 | 14（+6 新欄位） |
| AI 輸入 | 原始單日數據 | 統計摘要 + 規則 flag |
| AI 輸出 | 固定 2 區塊 | 動態區塊（由 flag 驅動） |
| 歷史資料 | 無 | healthsync export.zip 一次性匯入 |
| 規則引擎 | 無 | 硬編碼 v1（未來可演進為設定檔） |

## Goals / Non-Goals

**Goals:**

- 透過 Health Auto Export Webhook 全自動接收每日健康數據
- 擴充 6 個高價值指標（心智、深睡、呼吸率、VO2 Max、體溫偏離）
- 程式端先計算統計摘要 + 規則引擎判斷，壓縮後再送 AI（Token 優化）
- AI 根據觸發的規則 flag 動態決定輸出區塊
- 提供 CLI subcommand 一次性匯入 healthsync 歷史資料
- 四層驗證確保資料安全與品質

**Non-Goals:**

- 前端 UI（此版本純後端推播）
- 多用戶支援
- 即時健康警報
- 規則引擎設定檔驅動（v2 硬編碼，未來再演進）
- 取代現有的 skincare/cycle 機制

## Architecture

```
┌─────────────────┐     Webhook (JSON)      ┌──────────────────────┐
│ Health Auto      │ ──────────────────────→ │ Nexus API            │
│ Export (iOS)     │   X-API-Key header      │ POST /health/sync    │
└─────────────────┘                          └──────┬───────────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  4-Layer Validation  │
                                         │  1. API Key auth     │
                                         │  2. Struct binding   │
                                         │  3. Sanity check     │
                                         │  4. Temporal check   │
                                         └──────────┬──────────┘
                                                    │
┌─────────────────┐                      ┌──────────▼──────────┐
│ healthsync      │  CLI: nexus          │  DB: health_snapshots│
│ export.zip      │  import-health ────→ │  + workout_logs      │
└─────────────────┘  (one-time)          └──────────┬──────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  Morning Scanner     │
                                         │  08:00 Asia/Taipei   │
                                         └──────────┬──────────┘
                                                    │
                                    ┌───────────────▼───────────────┐
                                    │  Stats Engine (7d/30d summary)│
                                    │  + Rule Engine (hard-coded v1)│
                                    └───────────────┬───────────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  Compressed Context  │
                                         │  → Gemini API        │
                                         │  → Dynamic Sections  │
                                         └──────────┬──────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  Discord Notification│
                                         └─────────────────────┘
```

## Decisions

### Decision 1：資料來源切換 — Health Auto Export Webhook

**決策**：改用 Health Auto Export app 的 Webhook 功能主動推送數據至 Nexus，取代 iOS Shortcuts。

**理由**：
- iOS Shortcuts 設置繁瑣，維護成本高，已導致功能暫停
- Health Auto Export 提供原生 REST API / Webhook，設定簡單
- 支援的指標種類遠多於 Shortcuts 能取得的

**Payload 格式**（Health Auto Export 標準）：

```json
{
  "data": {
    "metrics": [
      {
        "name": "sleep_analysis",
        "units": "hr",
        "data": [
          {
            "date": "2026-03-11 23:30:00 -0800",
            "qty": 6.8,
            "source": "Apple Watch"
          }
        ]
      }
    ]
  }
}
```

三層結構：Envelope → Metrics Array（以 metric name 為 key） → Records（date, qty, units）。

---

### Decision 2：Schema 擴充

**決策**：在 `HealthSnapshot` 新增 6 個欄位，全部 nullable（pointer types），維持向後相容。

| 新欄位 | 型別 | 來源 metric name | 決策理由 |
|--------|------|-----------------|----------|
| `mood_score` | `*float64` | `state_of_mind` | RPE 與心理壓力比生理數據更早反映 CNS 疲乏 |
| `mood_label` | `*string` | `state_of_mind` (label) | 區分「身體累」vs「心裡累」 |
| `deep_sleep_hours` | `*float64` | `sleep_analysis` (deep stage) | 肌肉修復的真正關鍵，總睡眠長不等於恢復好 |
| `respiratory_rate` | `*float64` | `respiratory_rate` | 過度訓練/發炎的早期預警，極度準確 |
| `vo2_max` | `*float64` | `vo2_max` | HYROX 北極星指標，長期心肺引擎追蹤 |
| `wrist_temp_deviation` | `*float64` | `wrist_temperature` | 發炎/免疫/女性生理階段變化的高價值參考 |

---

### Decision 3：四層驗證架構

**第一層：API Key 認證（Security Validation）**

Gin Middleware 攔截所有 Webhook 請求，檢查 `X-API-Key` header 是否與 `NEXUS_API_KEY` 環境變數一致。不一致直接 401。

**第二層：結構驗證（Structural Validation）**

利用 Gin binding + go-playground/validator，`binding:"required"` 標記必填欄位。格式錯誤直接 400。

**第三層：生理邊界值檢驗（Sanity Check）**

獨立 `Validate()` 函式，運動員合理範圍：

| 指標 | 合理範圍 | 備註 |
|------|----------|------|
| sleep_hours | 0 < x ≤ 24 | |
| resting_hr | 30 ≤ x ≤ 150 | 高強度心肺訓練者 RHR 可低至 40s |
| hrv | 10 ≤ x ≤ 250 ms | |
| active_calories | 0 ≤ x ≤ 10000 kcal | HYROX 賽事日消耗極大 |
| deep_sleep_hours | 0 ≤ x ≤ 12 | |
| respiratory_rate | 5 ≤ x ≤ 40 次/分 | |
| vo2_max | 15 ≤ x ≤ 80 ml/kg/min | |
| wrist_temp_deviation | -3.0 ≤ x ≤ 3.0 °C | |
| mood_score | 0 ≤ x ≤ 10 | |
| body_fat | 3 ≤ x ≤ 60 % | |
| weight | 20 ≤ x ≤ 300 kg | |
| steps | 0 ≤ x ≤ 100000 | |

超出範圍的個別欄位記 warning log 並丟棄該欄位值（不拒絕整筆請求）。

**第四層：時間軸驗證（Temporal Validation）**

- 不接受未來時間戳
- 每日更新模式：時間戳不超過過去 48 小時
- 超出範圍 → 400 Bad Request

---

### Decision 4：Metric Name Mapping

Health Auto Export 的 metric name → DB 欄位對照表（集中管理）：

```go
var metricMapping = map[string]string{
    "sleep_analysis":               "sleep_hours",
    "heart_rate_variability_sdnn":   "hrv",
    "resting_heart_rate":            "resting_hr",
    "active_energy":                 "active_calories",
    "body_mass":                     "weight",
    "body_fat_percentage":           "body_fat",
    "step_count":                    "steps",
    "state_of_mind":                 "mood_score",  // + mood_label
    "sleep_analysis_deep":           "deep_sleep_hours",
    "respiratory_rate":              "respiratory_rate",
    "vo2_max":                       "vo2_max",
    "wrist_temperature":             "wrist_temp_deviation",
}
```

新增 metric 只要加一行 mapping，不改核心邏輯。

---

### Decision 5：Stats Engine

**觸發時機**：每早 Morning Scanner 執行時，在呼叫 AI 之前計算。

**計算內容**：

- 7 天 / 30 天滑動窗口
- 每個指標：均值、標準差、趨勢方向（上升 / 持平 / 下降）
- 輸出為壓縮摘要結構體 `HealthStatsSummary`

```go
type MetricStats struct {
    Mean7d     *float64 `json:"mean_7d"`
    Mean30d    *float64 `json:"mean_30d"`
    StdDev7d   *float64 `json:"std_dev_7d"`
    Trend7d    string   `json:"trend_7d"` // "rising" | "stable" | "declining"
}

type HealthStatsSummary struct {
    SleepHours       MetricStats `json:"sleep_hours"`
    HRV              MetricStats `json:"hrv"`
    RestingHR        MetricStats `json:"resting_hr"`
    DeepSleepHours   MetricStats `json:"deep_sleep_hours"`
    RespiratoryRate  MetricStats `json:"respiratory_rate"`
    VO2Max           MetricStats `json:"vo2_max"`
    WristTempDev     MetricStats `json:"wrist_temp_deviation"`
    MoodScore        MetricStats `json:"mood_score"`
    Weight           MetricStats `json:"weight"`
    BodyFat          MetricStats `json:"body_fat"`
    Steps            MetricStats `json:"steps"`
    ActiveCalories   MetricStats `json:"active_calories"`
}
```

---

### Decision 6：Rule Engine v1（硬編碼）

**設計**：獨立 `rule_engine.go`，輸入為今日快照 + Stats Summary，輸出為觸發的 flag 列表。

**v1 規則集**：

| Rule ID | 條件 | Flag | 嚴重程度 |
|---------|------|------|----------|
| `deep_sleep_insufficient` | deep_sleep_hours < 1.0 hr | 深睡不足，不建議高強度訓練 | high |
| `respiratory_rate_spike` | respiratory_rate > 個人 7d 均值 + 2 | 呼吸率異常，可能發炎或過度訓練 | high |
| `chronic_sleep_deficit` | 連續 3 天 sleep_hours < 6.0 | 慢性睡眠不足，累積疲勞風險 | high |
| `hrv_declining` | HRV 7d 均值較 30d 均值下降 > 15% | HRV 趨勢下降，自律神經壓力 | medium |
| `low_mood` | mood_score < 3.0 | 心理狀態低落，建議輕量活動 | medium |
| `elevated_temperature` | wrist_temp_deviation > +0.5°C | 體溫偏高，可能免疫系統運作中 | medium |
| `vo2_max_declining` | VO2 Max 30d 趨勢 = declining | 有氧適能下降，檢視 Zone 2 訓練量 | low |
| `weight_trending_up` | weight 30d 趨勢 = rising 且 body_fat 30d 趨勢 = rising | 體重體脂同步上升 | low |

```go
type RuleFlag struct {
    RuleID   string `json:"rule_id"`
    Message  string `json:"message"`
    Severity string `json:"severity"` // "high" | "medium" | "low"
}
```

**演進路徑**：v2 可將規則抽成 YAML 設定檔 + 規則解析引擎。

---

### Decision 7：AI Token 優化 — Compressed Context

**Prompt 結構**：

```
[系統角色]（~200 tokens，固定）
  個人健康顧問，依據數據與規則給具體可執行建議。繁體中文。

[今日快照]（~100 tokens）
  日期、各指標當日值（僅有值的欄位）

[統計摘要]（~150 tokens）
  7d/30d 均值、趨勢方向（僅有顯著變化的指標）

[觸發規則]（~50 tokens）
  flag 列表 + 嚴重程度

[輸出指令]（~50 tokens，動態）
  根據 flag 類型指定要回答的區塊名稱
```

**預估**：每日 ~500 tokens input，相比丟 30 天原始逐日數據（~3000+ tokens）節省 80%+。

---

### Decision 8：AI 動態輸出區塊

**機制**：根據觸發的 flag 類型，在 prompt 的輸出指令中指定 AI 要回答的區塊。

| 情境 | 觸發區塊 |
|------|----------|
| 無 flag | 簡短「狀態良好」+ 飲食建議 |
| 運動相關 flag（deep_sleep_insufficient, respiratory_rate_spike, chronic_sleep_deficit） | 訓練調整建議 |
| 恢復相關 flag（hrv_declining, elevated_temperature） | 恢復策略 |
| 情緒相關 flag（low_mood） | 心理調適建議 |
| 長期趨勢 flag（vo2_max_declining, weight_trending_up） | 長期策略調整 |
| 多 flag 同時觸發 | 組合多區塊 |

**WellnessRecommendation 表擴充**：

現有 `diet_advice` + `exercise_advice` → 改為 `sections` JSON 欄位，儲存動態區塊：

```go
type WellnessSection struct {
    Title   string `json:"title"`
    Content string `json:"content"`
}
```

DB 欄位 `sections` 型別為 `JSON`（PostgreSQL）或 `TEXT`（JSON string）。保留 `raw_response` 欄位。

---

### Decision 9：CLI Import Subcommand

**指令**：`nexus import-health --file export.zip`

**流程**：
1. 解壓 export.zip
2. 解析 healthsync 輸出格式（需調查具體格式，可能為 CSV 或 JSON）
3. 逐日 mapping 到 `HealthSnapshot` + `HealthWorkoutLog`
4. 批次 upsert（by date）
5. 輸出匯入統計：總天數、成功/跳過/失敗筆數

**定位**：Nexus CLI subcommand，共用 DB 連線和 model，確保資料一致性。

---

### Decision 10：Endpoint 改造

**決策**：直接改寫 `POST /api/lifeos/health/sync` 的 payload 解析邏輯，不新建 endpoint。

**變更**：
- Request body：iOS Shortcuts flat JSON → Health Auto Export `{ data: { metrics: [...] } }` 格式
- 認證：現有 auth middleware → 新增 API Key middleware（`X-API-Key` header）
- Response：維持現有（200 OK + upsert 結果）

**不需要相容舊格式**：iOS Shortcuts 已不使用。

## Risks / Trade-offs

- **Health Auto Export 依賴**：三方 app 如停止維護或改 API → 屆時再評估替代方案，Webhook 介面標準化程度高，遷移成本低
- **healthsync 格式未知**：export.zip 內容格式需實際匯出後才能確認 → import script 可能需要調整
- **規則引擎硬編碼維護成本**：新增/修改規則需改 code + 重新部署 → v1 可接受，規則穩定後再演進為設定檔
- **Gemini API 費用**：壓縮後 ~500 tokens/day，單一用戶成本極低（< $0.01/day）
- **統計引擎冷啟動**：歷史資料匯入前，7d/30d 統計窗口資料不足 → graceful degradation，資料不足時標註並降級為單日分析
- **動態輸出解析**：AI 回應格式可能不穩定 → 保留 raw_response，解析失敗時 fallback 顯示完整回應

## Migration Plan

1. Schema migration：GORM AutoMigrate 新增 6 欄位 + sections 欄位
2. 部署 API Key middleware + 新 payload 解析
3. 設定 `NEXUS_API_KEY` 環境變數（Railway）
4. Health Auto Export app 設定 Webhook URL + API Key
5. 匯入歷史資料：`nexus import-health --file export.zip`
6. 驗證每日 Webhook → Stats → Rules → AI → Discord 全流程
7. 移除舊 iOS Shortcuts 相關 code

## File Impact Analysis

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `internal/modules/lifeos/model/health_snapshot.go` | 修改 | 新增 6 欄位 |
| `internal/modules/lifeos/model/wellness_recommendation.go` | 修改 | diet_advice + exercise_advice → sections JSON |
| `internal/modules/lifeos/handler/health_handler.go` | 重寫 | 新 payload 解析 + 4 層驗證 |
| `internal/modules/lifeos/service/health_service.go` | 修改 | 調整 upsert 邏輯配合新欄位 |
| `internal/modules/lifeos/service/stats_engine.go` | 新增 | 7d/30d 統計計算 |
| `internal/modules/lifeos/service/rule_engine.go` | 新增 | 硬編碼規則 + flag 輸出 |
| `internal/modules/lifeos/service/claude_service.go` | 重寫 | 壓縮 prompt + 動態輸出解析 |
| `internal/modules/lifeos/service/reminder_scanner.go` | 修改 | 整合 stats + rules + 動態區塊 |
| `internal/middleware/apikey.go` | 新增 | X-API-Key 驗證 middleware |
| `cmd/server/main.go` | 修改 | 註冊 middleware、更新 AutoMigrate |
| `cmd/import-health/main.go` | 新增 | CLI subcommand：healthsync zip import |

## Open Questions

- healthsync export.zip 的具體內部格式（CSV? JSON? XML?）→ 需實際匯出一次確認
- Health Auto Export 的 `state_of_mind` metric 是否同時提供 score 和 label，還是分開兩個 metric？
- 深睡數據在 Health Auto Export 中的 metric name 是 `sleep_analysis` 的子分類還是獨立 metric？
