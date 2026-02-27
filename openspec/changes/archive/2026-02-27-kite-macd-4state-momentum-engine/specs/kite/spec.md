## MODIFIED Requirements

### Requirement: MACD 技術指標引擎

系統 MUST 提供 MACD 指標計算功能，支援日/週/月三個時間框架，並能判斷 4 種動能趨勢。

**後端資料模型**（Go `QuoteResponse`）：

```go
type QuoteResponse struct {
    // ... 其他欄位
    MacdHistogram     float64 `json:"macd_histogram"`
    MacdHistogramDays int     `json:"macd_histogram_days"`
    MacdTrendStatus   string  `json:"macd_trend_status"`   // STRONG_BULL, WEAKENING_BULL, STRONG_BEAR, WEAKENING_BEAR
    MACDWeeklyTrend   string  `json:"macd_weekly_trend"`
}
```

**前端型別**（TypeScript）：

```typescript
type MacdTrendStatus = 'STRONG_BULL' | 'WEAKENING_BULL' | 'STRONG_BEAR' | 'WEAKENING_BEAR';
```

**色碼對應（台股紅漲綠跌慣例）**：
| 狀態 | 說明 | 色碼 |
|------|------|------|
| `STRONG_BULL` | histogram > 0 且 >= 前日 | `#ef4444`（深紅） |
| `WEAKENING_BULL` | histogram > 0 且 < 前日 | `#fca5a5`（淺紅） |
| `STRONG_BEAR` | histogram < 0 且 <= 前日 | `#22c55e`（深綠） |
| `WEAKENING_BEAR` | histogram < 0 且 > 前日 | `#86efac`（淺綠） |

**實作位置**：
- 後端計算 + 狀態判定：`internal/modules/kite/service/quote_service.go`（`calculateMACD()` 回傳 `trendStatus`）
- 前端色碼常數 + K 線圖序列狀態：`src/apps/kite/utils/macdUtils.ts`
- 前端 Quote 型別：`src/apps/kite/types.ts`（`QuoteData.macd_trend_status`）

**已知問題**：
- `calculateMACDDays.ts` 有 off-by-one 精度問題待修正（本次不處理）
- 週趨勢邏輯應改用 DIF（藍線）斜率判斷，避免「週三假訊號」

#### Scenario: 日 K MACD 計算

- WHEN 使用者查看個股日 K 線圖
- THEN 系統 MUST 計算並顯示 DIF、DEA、Histogram
- AND 資料 SHALL 來自 Fugle API `/api/kite/chart/:symbol?timeframe=daily`

#### Scenario: 週 K / 月 K MACD 計算

- WHEN 使用者切換至週 K 或月 K 時間框架
- THEN 系統 MUST 分批取得足夠歷史資料（Fugle API 有日期範圍限制）
- AND 系統 SHALL 正確聚合為週/月 K 資料後計算 MACD

#### Scenario: MACD 柱狀圖視覺化

- WHEN 系統在 `StockChart` 渲染 MACD 柱狀圖
- THEN 系統 MUST 依照 `trendStatus` 顯示正確顏色
- AND `STRONG_BULL` 顯示深紅 (#ef4444)
- AND `WEAKENING_BULL` 顯示淺紅 (#fca5a5)
- AND `STRONG_BEAR` 顯示深綠 (#22c55e)
- AND `WEAKENING_BEAR` 顯示淺綠 (#86efac)

#### Scenario: MACD 動能衰退警告 (OFFICE 策略防護)

- WHEN 使用者查看個股診斷並評估 OFFICE 動能追價策略
- AND 後端回傳之 `macd_trend_status` 為 `WEAKENING_BULL`
- THEN 系統 MUST 在 `StrategyChecklist` 顯示 `AlertTriangleIcon`  與「動能衰退，不宜追價」
- AND 系統 MUST 在 Verdict「Caution - 觀察中」卡片**內部**顯示「動能衰退中：日 MACD 紅柱連續縮短，不宜追漲。」
- AND 系統 MUST 在 Daily MACD Days tech-card 下方顯示「▼ 動能衰退」（粉紅色）

#### Scenario: MACD 動能趨勢圖示 (Dashboard tech-card)

- WHEN 使用者在 StockInspector Dashboard 查看 Daily MACD Days 技術指標
- THEN 數值顏色 MUST 依 `macd_trend_status` 對應色碼
- AND 數值下方 SHALL 顯示趨勢圖示：
  - `STRONG_BULL` → `▲ 動能強勁`（深紅）
  - `WEAKENING_BULL` → `▼ 動能衰退`（粉紅）
  - `STRONG_BEAR` → `▼ 跌勢擴張`（深綠）
  - `WEAKENING_BEAR` → `▲ 跌勢收斂`（淺綠）

#### Scenario: OFFICE 持股 MACD 轉弱通知

- WHEN 系統掃描 OFFICE 策略持股（STRONG_WEEKLY 或 WEEKLY_TREND）
- AND 該持股之 `macd_trend_status` 為 `WEAKENING_BULL`
- THEN 系統 MUST 產生 STRATEGY_RULE Alert「📉 日 MACD 轉弱，停利出場: {公司名稱} 紅柱縮短中」
- AND 系統 SHALL 透過 Discord 推送此通知
