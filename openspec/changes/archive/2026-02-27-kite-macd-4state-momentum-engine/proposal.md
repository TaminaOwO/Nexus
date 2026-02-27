## Why

目前的 MACD 指標僅有單一數值，無法直觀判斷柱狀體是「增強」還是「衰退」。為了強化「紀律 > 分析」的守門員機制，我們需要精確區分 MACD Histogram 的四種動能狀態（強勢多頭、多頭衰退、強勢空頭、空頭收斂），並透過台股慣用的紅綠色系給予視覺提示。這能防止使用者在「多頭衰退（紅柱縮短）」時誤觸 OFFICE 追漲策略，同時協助 BOSS 策略尋找「空頭收斂」的轉折點。

## What Changes

1. **後端 `quote_service.go`**：修改 `calculateMACD()` 回傳第三個值 `trendStatus`，透過比較 `histogram[-2]` vs `histogram[-3]` 判定四種狀態。`QuoteResponse` 新增 `macd_trend_status` 欄位。
2. **前端 `macdUtils.ts`**：定義 `MacdTrendStatus` type、`MACD_STATUS_COLORS` 色碼常數、`calculateMacdStatus()` 函式（供 K 線圖完整序列上色用）。
3. **前端 `StockChart.tsx`**：MACD 柱狀體依四色渲染，`latestMacdStatus` 透過 `useMemo` 計算並傳給 `StrategyChecklist`。
4. **前端 `StockInspector.tsx`**：
   - Verdict「Caution - 觀察中」卡片**內部**新增 MACD 衰退提醒文字
   - Daily MACD Days tech-card 新增趨勢圖示（▲/▼）與狀態色碼
   - `StrategyChecklist` 傳入 `macdTrendStatus` prop（來自後端 `quote.macd_trend_status`）
5. **前端 `StrategyChecklist.tsx`**：OFFICE 策略（STRONG_WEEKLY / WEEKLY_TREND）+ `WEAKENING_BULL` 時，顯示 `AlertTriangleIcon` 與「動能衰退，不宜追價」。
6. **後端 `portfolio_service.go`**：OFFICE 持股遇 `WEAKENING_BULL` 時觸發 STRATEGY_RULE alert「📉 日 MACD 轉弱，停利出場」，並透過 Discord 推送通知。

## Capabilities

### New Capabilities

<!-- No entirely new spec files needed; this change extends the existing kite capability -->

### Modified Capabilities

- `kite`: 後端 `QuoteResponse` 新增 `macd_trend_status` 欄位；前端 MACD 四色柱狀圖視覺化；OFFICE 策略動能衰退守門員（前端 UI + 後端 Alert）。

## Impact

- **Backend (Go)**: `internal/modules/kite/service/quote_service.go`、`portfolio_service.go`
- **Frontend Utils**: `src/apps/kite/utils/macdUtils.ts`（新增）
- **Frontend Components**: `StockChart.tsx`、`StockInspector.tsx`、`StrategyChecklist.tsx`
- **Frontend Types**: `src/apps/kite/types.ts`（`QuoteData` 新增 `macd_trend_status`）
- **Shared**: `src/components/Icons.tsx`（`AlertTriangleIcon` 已存在）
- **No DB schema changes**
- **No cross-module API changes**
