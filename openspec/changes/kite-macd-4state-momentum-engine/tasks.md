## 1. Shared Icons

- [x] 1.1 在 `src/components/Icons.tsx` 中新增 `AlertTriangleIcon`（SVG，Lucide 風格，strokeWidth=2，viewBox="0 0 24 24"）

## 2. MACD 狀態工具

- [x] 2.1 建立 `src/apps/kite/utils/macdUtils.ts`，定義 `MacdTrendStatus` type 與四種狀態常數色碼（`MACD_STATUS_COLORS`）
- [x] 2.2 在 `macdUtils.ts` 實作 `calculateMacdStatus(histograms: number[]): (MacdTrendStatus | null)[]`，遍歷歷史資料比較 `histogram[i]` 與 `histogram[i-1]`，首筆回傳 `null`

## 3. StockChart 視覺化

- [x] 3.1 修改 `StockChart.tsx`，import `calculateMacdStatus` 與 `MACD_STATUS_COLORS`
- [x] 3.2 在 `StockChart.tsx` MACD 柱狀體渲染邏輯中，依 `trendStatus` 套用對應色碼（取代原本固定正/負色）

## 4. StrategyChecklist 守門員

- [x] 4.1 修改 `StrategyChecklist.tsx`，import `AlertTriangleIcon` 與 `MACD_STATUS_COLORS`
- [x] 4.2 在 OFFICE 策略區塊加入條件判斷：當最新一日 `trendStatus === 'WEAKENING_BULL'` 時，渲染 `AlertTriangleIcon` 與橘色文字「動能衰退，不宜追價」
