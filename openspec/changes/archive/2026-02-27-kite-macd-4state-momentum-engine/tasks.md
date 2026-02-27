## 1. Shared Icons

- [x] 1.1 在 `src/components/Icons.tsx` 中確認 `AlertTriangleIcon` 存在（已有）

## 2. 後端：MACD 狀態計算

- [x] 2.1 修改 `quote_service.go` 的 `calculateMACD()` 函式簽名，新增第三個回傳值 `trendStatus string`
- [x] 2.2 在 `calculateMACD()` 中比較 `histogramSeries[-2]` vs `histogramSeries[-3]`，判定四種狀態
- [x] 2.3 `QuoteResponse` struct 新增 `MacdTrendStatus string` 欄位（JSON: `macd_trend_status`）
- [x] 2.4 修改 `GetQuote()` 呼叫端接收第三個回傳值並填入 `QuoteResponse`

## 3. 後端：Portfolio MACD 轉弱通知

- [x] 3.1 修改 `portfolio_service.go` 的 `checkStrategyExitRules()`
- [x] 3.2 在 OFFICE `STRONG_WEEKLY` 區塊新增 Rule 4：`MacdTrendStatus == "WEAKENING_BULL"` 時觸發「📉 日 MACD 轉弱，停利出場」
- [x] 3.3 在 OFFICE `WEEKLY_TREND` 區塊新增 Rule 3：同上邏輯

## 4. 前端：MACD 狀態工具

- [x] 4.1 建立 `src/apps/kite/utils/macdUtils.ts`，定義 `MacdTrendStatus` type 與 `MACD_STATUS_COLORS`
- [x] 4.2 實作 `calculateMacdStatus(histograms: number[]): (MacdTrendStatus | null)[]`
- [x] 4.3 `types.ts` 的 `QuoteData` 新增 `macd_trend_status` 欄位

## 5. 前端：StockChart 視覺化

- [x] 5.1 修改 `StockChart.tsx`，import `calculateMacdStatus` 與 `MACD_STATUS_COLORS`
- [x] 5.2 MACD 柱狀體渲染邏輯中，依 `trendStatus` 套用對應色碼
- [x] 5.3 透過 `useMemo` 計算 `latestMacdStatus` 並傳給 `StrategyChecklist`

## 6. 前端：StockInspector UI

- [x] 6.1 Verdict「Caution - 觀察中」卡片**內部**新增 MACD 衰退提醒文字（`verdict.message` 下方）
- [x] 6.2 Daily MACD Days tech-card 新增趨勢圖示（▲ 動能強勁 / ▼ 動能衰退 / ▼ 跌勢擴張 / ▲ 跌勢收斂）
- [x] 6.3 Daily MACD Days 數值顏色同步改為 `MACD_STATUS_COLORS[status]`
- [x] 6.4 Dashboard 的 `StrategyChecklist` 傳入 `macdTrendStatus` prop（來自 `quote.macd_trend_status`）

## 7. 前端：StrategyChecklist 守門員

- [x] 7.1 修改 `StrategyChecklist.tsx`，接受 `macdTrendStatus` prop
- [x] 7.2 OFFICE 策略（STRONG_WEEKLY / WEEKLY_TREND）+ `WEAKENING_BULL` 時，渲染「動能衰退，不宜追價」
