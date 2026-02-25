# Kite 股票交易模組規格

> **模組路由**：`/kite`
> **資料表前綴**：`kite_`
> **狀態**：✅ 完成
> **最後更新**：2026-02-24
> **來源**：`design-system/nexus/pages/KITE_SPECS.md`

---

## Requirements

### Requirement: Wind 風型記錄系統

使用者 MUST 能夠每日手動記錄當日市場風型（Wind），系統 SHALL 自動根據最近 5 個交易日的風型分布計算市場結構（Structure），並綜合產生進場門燈（Gate Light）。

**WindType 定義**：

| 風型 | 代碼 | 意義 | 市場特徵 |
|------|------|------|----------|
| STRONG | `STRONG` | 強風 | 大盤強勁，適合順勢 |
| TURBULENT | `TURBULENT` | 亂流 | 波動劇烈，易洗盤 |
| GUSTY | `GUSTY` | 陣風 | 小幅波動，方向不明 |
| CALM | `CALM` | 無風 | 冷清或緩跌 |

**StructureType 定義**：

| 結構 | 判定條件 | 操作傾向 |
|------|----------|----------|
| EASY_RISE (易漲) | 多數天為 STRONG/TURBULENT | 偏多操作 |
| EASY_FALL (易跌) | 多數天為 GUSTY/CALM | 偏空/觀望 |
| BOUNDARY (盤整) | 多空混雜 | 區間操作 |

**資料模型** (`internal/modules/kite/model/wind.go`)：

```go
type WindRecord struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    Date      string    `gorm:"uniqueIndex;type:date" json:"date"` // YYYY-MM-DD
    Wind      string    `json:"wind"`                              // STRONG, TURBULENT, GUSTY, CALM
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

**Gate Light 定義**：

| 燈號 | 條件 | 行動準則 |
|------|------|----------|
| GREEN | EASY_RISE + STRONG | 允許大膽進場 (OFFICE 策略) |
| YELLOW | 混合信號 / BOUNDARY | 謹慎/觀望 (BOSS 策略為主) |
| RED | EASY_FALL 或 CALM | 禁止進場 / 空手 |

#### Scenario: 記錄每日風型

- WHEN 使用者在 WindCockpit 元件中選擇一個風型
- THEN 系統 MUST 將風型記錄持久化至 `WindRecord` 資料表
- AND 系統 SHALL 自動重新計算最近 5 日的 Structure
- AND 系統 SHALL 根據 Wind + Structure 更新 Gate Light 燈號

#### Scenario: 查看風型歷史

- WHEN 使用者進入 WindCockpit 頁面
- THEN 系統 MUST 顯示最新風型、當前結構、門燈狀態
- AND 系統 SHALL 提供風型歷史記錄供回顧

---

### Requirement: OFFICE 策略 - 動能追價

系統 MUST 支援 OFFICE 上班族型策略，適用於 Gate = GREEN / Structure = EASY_RISE 條件下的動能追價操作。

**視覺識別**：`BriefcaseIcon` (SVG) + 紫色系 (`--office-primary: #6366f1`)

| 子策略 | 代碼 | 圖示 | 觸發條件 | 操作方式 |
|--------|------|------|----------|----------|
| 週線強勢 | `STRONG_WEEKLY` | `ZapIcon` | 週線 MACD 金叉 + 量增 | 追漲買入 |
| 週趨勢 | `WEEKLY_TREND` | `ActivityIcon` | 多頭排列 + 拉回不破支撐 | 買拉回 |

**策略護欄**：建議 3-5 批進場，停損門檻 -5% 出場。

**交易資料模型** (`internal/modules/kite/model/trade.go`)：

```go
type TradeEntry struct {
    ID              string    `gorm:"primaryKey" json:"id"`
    Symbol          string    `json:"symbol"`
    CompanyName     string    `json:"company_name"`
    EntryPrice      float64   `json:"entry_price"`
    Quantity        int64     `json:"quantity"`
    PlannedBatches  int       `json:"planned_batches"`
    CurrentBatch    int       `json:"current_batch"`
    Strategy        string    `json:"strategy"`          // OFFICE | BOSS
    SubStrategy     string    `json:"sub_strategy"`
    Cycle           string    `json:"cycle"`
    StopLossPrice   float64   `json:"stop_loss_price"`
    TakeProfitPrice float64   `json:"take_profit_price"`
    Status          string    `json:"status"`            // OPEN | CLOSED
    CreatedAt       time.Time `json:"created_at"`
    // Snapshot fields (flattened for SQLite)
    SnapshotMA20Deviation float64 `json:"snapshot_ma20_deviation"`
    SnapshotMA60Deviation float64 `json:"snapshot_ma60_deviation"`
    SnapshotMacdDays      int     `json:"snapshot_macd_days"`
    SnapshotWeeklyTrend   string  `json:"snapshot_weekly_trend"`
    SnapshotCurrentPrice  float64 `json:"snapshot_current_price"`
    // Settlement fields
    ExitPrice      float64    `json:"exit_price"`
    ExitNotes      string     `json:"exit_notes"`
    FinalPL        float64    `json:"final_pl"`
    FinalPLPercent float64    `json:"final_pl_percent"`
    ClosedAt       *time.Time `json:"closed_at"`
}

type StrategySnapshot struct {
    MA20Deviation float64 `json:"ma20_deviation"`
    MA60Deviation float64 `json:"ma60_deviation"`
    MacdDays      int     `json:"macd_days"`
    WeeklyTrend   string  `json:"weekly_trend"`
    CurrentPrice  float64 `json:"current_price"`
}
```

**觀察清單資料模型** (`internal/modules/kite/model/watchlist.go`)：

```go
type WatchlistEntry struct {
    ID          string    `gorm:"primaryKey" json:"id"`
    Symbol      string    `json:"symbol"`
    CompanyName string    `json:"company_name"`
    TargetPrice float64   `json:"target_price"`
    Strategy    string    `json:"strategy"`     // OFFICE | BOSS
    SubStrategy string    `json:"sub_strategy"`
    Notes       string    `json:"notes"`
    Status      string    `json:"status"`       // WATCHING | READY | ENTERED
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

**週期設定模型** (`internal/modules/kite/model/cycle_setting.go`)：

```go
type CycleSetting struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    WeekKey   string    `gorm:"uniqueIndex" json:"week_key"` // Format: "2024-W03"
    Cycle     string    `json:"cycle"`                       // EASY_RISE, EASY_FALL, BOUNDARY
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

#### Scenario: OFFICE 策略進場

- WHEN Gate Light 為 GREEN 且 Structure 為 EASY_RISE
- THEN 系統 SHALL 允許使用 OFFICE 策略建立交易
- AND 系統 MUST 自動套用 3-5 批建議與 -5% 停損門檻

#### Scenario: OFFICE 策略禁止進場

- WHEN Gate Light 為 RED 或 YELLOW
- THEN 系統 SHALL 不建議使用 OFFICE 策略
- AND 介面 SHOULD 顯示警示訊息

---

### Requirement: BOSS 策略 - 價值佈局

系統 MUST 支援 BOSS 老闆型策略，適用於 Gate = YELLOW/RED 或 Structure ≠ EASY_RISE 條件下的價值佈局操作。

**視覺識別**：`ShieldIcon` (SVG) + 金色系 (`--boss-primary: #f59e0b`)

| 子策略 | 代碼 | 圖示 | 觸發條件 | 操作方式 |
|--------|------|------|----------|----------|
| 週拉回 | `WEEKLY_PULLBACK` | `RotateCcwIcon` | 週線回測支撐 + RSI < 30 | 分批承接 |
| 廉價收購 | `CHEAP_ACQUISITION` | `TagIcon` | 低本益比 / 高殖利率 | 長期持有 |

**策略護欄**：建議 10-15 批進場，停損門檻 -10% 減碼。

#### Scenario: BOSS 策略分批建倉

- WHEN 使用者選擇 BOSS 策略進場
- THEN 系統 MUST 自動套用 10-15 批建議
- AND 系統 SHALL 設定 -10% 停損門檻

---

### Requirement: MACD 技術指標引擎

系統 MUST 提供 MACD 指標計算功能，支援日/週/月三個時間框架。

```typescript
interface MACDResult {
  dif: number;      // 快線 - 慢線
  macd: number;     // DIF - DEA
  dea: number;      // DIF 的 9 日 EMA
  histogram: number; // 柱狀圖 (MACD)
}
```

**實作位置**：`src/apps/kite/utils/calculateMACDDays.ts`

**已知問題**：
- `calculateMACDDays` 有 off-by-one 精度問題待修正
- 週趨勢邏輯應改用 DIF（藍線）斜率判斷，避免「週三假訊號」

#### Scenario: 日 K MACD 計算

- WHEN 使用者查看個股日 K 線圖
- THEN 系統 MUST 計算並顯示 DIF、DEA、Histogram
- AND 資料 SHALL 來自 Fugle API `/api/kite/chart/:symbol?timeframe=daily`

#### Scenario: 週 K / 月 K MACD 計算

- WHEN 使用者切換至週 K 或月 K 時間框架
- THEN 系統 MUST 分批取得足夠歷史資料（Fugle API 有日期範圍限制）
- AND 系統 SHALL 正確聚合為週/月 K 資料後計算 MACD

---

### Requirement: 資料來源整合

系統 MUST 整合外部資料來源以提供即時報價與歷史 K 線資料。

| 來源 | 用途 | 注意事項 |
|------|------|----------|
| Fugle API | K 線歷史資料 | 有日期範圍限制需分批取；`.TW` (上市) / `.TWO` (櫃買) |
| TWSE API | 即時報價 | 中文公司名稱自動抓取 |

#### Scenario: 上市股票報價

- WHEN 使用者查詢上市股票（如 2330）
- THEN 系統 MUST 使用 `.TW` 後綴呼叫 Fugle API
- AND 系統 SHALL 顯示即時報價與中文公司名稱

#### Scenario: 櫃買股票報價

- WHEN 使用者查詢櫃買股票
- THEN 系統 SHOULD 自動偵測並使用 `.TWO` 後綴（Smart Suffix Retry 待實作）

---

### Requirement: Discord 警報通知系統

系統 MUST 提供 Discord Webhook 即時通知功能，支援 Portfolio 與 Watchlist 兩類警報。

**Portfolio 警報（6 種）**：停損觸及、停利達標、強制賣出（-10% 且無停損的非 BOSS）、策略規則警示。

**Watchlist 警報（2 種）**：目標價達標、策略條件滿足。

**背景掃描**：每 3 分鐘一次，僅在有 OPEN 倉位或 WATCHING 觀察清單時執行。

**防重複**：24 小時內同一警報 MUST NOT 重複發送。

**通知記錄模型** (`internal/modules/kite/model/notification_log.go`)：

```go
type NotificationLog struct {
    ID        string    `gorm:"primaryKey" json:"id"`
    TradeID   string    `gorm:"index" json:"trade_id"`      // 交易 ID（Watchlist 通知為空）
    Symbol    string    `gorm:"index" json:"symbol"`        // 股票代碼
    AlertType string    `json:"alert_type"`                 // STOP_LOSS, TAKE_PROFIT, STRATEGY_RULE, FORCE_SELL, WATCHLIST_TARGET, WATCHLIST_STRATEGY
    SentAt    time.Time `json:"sent_at"`
}
```

#### Scenario: 停損觸發通知

- WHEN 持倉股票價格跌至停損價以下
- THEN 系統 MUST 透過 Discord Webhook 發送警報
- AND 24 小時內相同警報 MUST NOT 重複發送

#### Scenario: 觀察清單目標價到達

- WHEN 觀察清單中的股票達到設定的目標價
- THEN 系統 MUST 發送 Discord 通知
- AND 通知內容 SHALL 包含股票代碼、目標價與當前價格

---

### Requirement: Kite API 端點

系統 MUST 提供以下 RESTful API 端點：

```
GET    /api/kite/ping                  # 健康檢查
GET    /api/kite/quote                 # 即時報價
GET    /api/kite/quotes                # 批量即時報價
GET    /api/kite/chart                 # K線資料
POST   /api/kite/journal               # 新增交易
GET    /api/kite/journal               # 交易記錄
GET    /api/kite/portfolio             # 持倉（含警報檢查）
POST   /api/kite/trade/:id/settle      # 平倉結算
DELETE /api/kite/trade/:id             # 刪除交易
GET    /api/kite/history               # 歷史績效
POST   /api/kite/import                # 匯入歷史交易
GET    /api/kite/wind/latest           # 最新風型
GET    /api/kite/wind/history          # 風型歷史
POST   /api/kite/wind                  # 記錄風型
GET    /api/kite/cycle                 # 週期設定
POST   /api/kite/cycle                 # 儲存週期設定
DELETE /api/kite/cycle                 # 刪除週期設定
GET    /api/kite/watchlist             # 觀察清單
GET    /api/kite/watchlist/:id         # 單筆觀察
POST   /api/kite/watchlist             # 新增觀察
PUT    /api/kite/watchlist/:id         # 更新觀察
DELETE /api/kite/watchlist/:id         # 刪除觀察
POST   /api/kite/watchlist/:id/convert # 轉為交易
GET    /api/kite/watchlist/alerts      # 觀察清單警報
POST   /api/kite/test-webhook          # 測試通知
```

#### Scenario: API 健康檢查

- WHEN 客戶端發送 `GET /api/kite/ping`
- THEN 系統 MUST 回傳 200 OK

---

### Requirement: Kite UI Icon 系統

所有策略和動作圖示 MUST 使用 SVG 元件（定義於 `src/components/Icons.tsx`），禁止在 Production 中使用原生 Emoji。

| 用途 | SVG 元件 |
|------|----------|
| OFFICE 策略 | `BriefcaseIcon` |
| BOSS 策略 | `ShieldIcon` |
| 週線強勢 | `ZapIcon` |
| 週趨勢 | `ActivityIcon` |
| 週拉回 | `RotateCcwIcon` |
| 廉價收購 | `TagIcon` |
| 進場按鈕 | `RocketIcon` / `LockIcon` |
| 刪除 | `TrashIcon` |
| 關閉 | `XIcon` |
| 備註 | `BookOpenIcon` |
| 價格 | `DollarSignIcon` |
| 條件通過 | `CheckCircleIcon` |
| 條件未通過 | `XCircleIcon` |

#### Scenario: 策略圖示渲染

- WHEN 介面顯示策略標籤
- THEN 系統 MUST 使用對應的 SVG 元件
- AND OFFICE 策略 SHALL 使用紫色系 (`--office-primary`)
- AND BOSS 策略 SHALL 使用金色系 (`--boss-primary`)

---

### Requirement: 元件清單

| 元件 | 檔案 | 功能 |
|------|------|------|
| `WindCockpit` | `WindCockpit.tsx` | 風型記錄 + 結構顯示 + 門燈 |
| `StockInspector` | `StockInspector.tsx` | 個股分析 + K線圖 + 策略診斷 |
| `StockChart` | `StockChart.tsx` | K線圖表 (日/週/月) + 關閉按鈕 (`XIcon`) |
| `StrategyChecklist` | `StrategyChecklist.tsx` | 策略條件清單 + SVG 子策略圖示 |
| `Watchlist` | `Watchlist.tsx` | 觀察清單管理 + SVG 策略/動作圖示 |
| `TradeJournal` | `TradeJournal.tsx` | 進行中交易 + SVG 策略圖示 |
| `TradeHistory` | `TradeHistory.tsx` | 歷史績效 |

#### Scenario: K 線圖行動裝置體驗

- WHEN 使用者在手機上查看 K 線圖
- THEN 介面 MUST 支援觸控縮放
- AND 介面 SHOULD 支援橫屏模式
