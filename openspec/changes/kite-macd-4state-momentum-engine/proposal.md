## Why

目前的 MACD 指標僅有單一數值，無法直觀判斷柱狀體是「增強」還是「衰退」。為了強化「紀律 > 分析」的守門員機制，我們需要精確區分 MACD Histogram 的四種動能狀態（強勢多頭、多頭衰退、強勢空頭、空頭收斂），並透過台股慣用的紅綠色系給予視覺提示。這能防止使用者在「多頭衰退（紅柱縮短）」時誤觸 OFFICE 追漲策略，同時協助 BOSS 策略尋找「空頭收斂」的轉折點。

## What Changes

1. 新增 `macdUtils.ts`，實作 `calculateMacdStatus` 邏輯，藉由比較當日與前一日的 `macd_hist`，判定四種狀態。
2. 定義四種狀態的標準色碼（台股紅綠邏輯）：`STRONG_BULL` (#ef4444)、`WEAKENING_BULL` (#fca5a5)、`STRONG_BEAR` (#22c55e)、`WEAKENING_BEAR` (#86efac)。
3. 在 `StockChart` 與相關組件中，根據狀態為 MACD 柱狀圖上色。
4. 在 `StrategyChecklist` 中加入守門員邏輯：若判定為 `WEAKENING_BULL` 且欲使用 OFFICE 策略，顯示警告標示。
5. 在 `src/components/Icons.tsx` 中新增 `AlertTriangleIcon`。

## Capabilities

### New Capabilities

<!-- No entirely new spec files needed; this change extends the existing kite capability -->

### Modified Capabilities

- `kite`: MACD 指標引擎新增 `trendStatus` 與 `colorCode` 欄位，`MACDResult` interface 擴充；新增 OFFICE 策略動能衰退守門員場景與 MACD 柱狀圖四色視覺化場景。

## Impact

- **Utils**: `src/apps/kite/utils/macdUtils.ts`（新增，或整合至現有 `calculateMACDDays.ts`）
- **Frontend Components**: `StockChart.tsx`、`StockInspector.tsx`、`StrategyChecklist.tsx`
- **Shared**: `src/components/Icons.tsx`（新增 `AlertTriangleIcon`）
- **No DB schema changes**（純前端計算邏輯）
- **No cross-module API changes**
