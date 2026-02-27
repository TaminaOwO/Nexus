## Context

Kite 模組後端 `quote_service.go` 的 `calculateMACD()` 已經計算了完整的 histogram 序列，但只回傳最終數值與連續天數，無狀態語義。前端 `StockChart` 使用固定正/負色判斷柱狀體顏色，無法反映「增強 vs 衰退」的差異。`StrategyChecklist` 與 `portfolio_service.go` 也沒有針對 MACD 動能衰退的守門員邏輯。

## Goals / Non-Goals

**Goals:**
- 後端 `calculateMACD()` 新增 `trendStatus` 回傳值，`QuoteResponse` 新增 `macd_trend_status`
- 前端 `macdUtils.ts` 集中管理狀態常數、色碼、與前端用 `calculateMacdStatus` 函式
- `StockChart` MACD 柱狀體改用四色渲染
- `StockInspector` Verdict 卡片內顯示 MACD 衰退提醒 + Daily MACD Days 趨勢圖示
- `StrategyChecklist` 在 OFFICE 策略 + `WEAKENING_BULL` 時注入警告 UI
- `portfolio_service.go` OFFICE 持股遇 MACD 轉弱時推送 Discord 通知

**Non-Goals:**
- 不改動 DB schema
- 不影響 LifeOS / ChoiceFit 模組
- 不修正 `calculateMACDDays.ts` 的 off-by-one 問題（留作後續）

## Decisions

### 1. 後端直接回傳 `macd_trend_status`

**決定**：在 Go 後端 `calculateMACD()` 比較 `histogramSeries[-2]` vs `histogramSeries[-3]` 判定狀態。

**理由**：
- 後端已持有完整 histogram 序列，不需要額外 API 呼叫
- `StockInspector` Dashboard 不需要開 K 線圖就能取得 MACD 狀態
- 前後端資料一致性：後端為 single source of truth

**備選方案**：純前端計算 → 拒絕，因 Dashboard 需在未開 K 線圖時就顯示狀態

### 2. 前端 `macdUtils.ts` 用於 K 線圖完整序列上色

**決定**：建立 `src/apps/kite/utils/macdUtils.ts`，提供 `calculateMacdStatus()` 與 `MACD_STATUS_COLORS`。

**理由**：
- K 線圖需要為**每一根柱狀體**上色，需要完整歷史序列
- 後端只回傳最新一日狀態，無法滿足圖表需求
- 職責分離：後端管 Dashboard 即時狀態，前端管圖表渲染

### 3. 色碼採台股慣用紅漲綠跌邏輯

**決定**：多頭用紅色系（`#ef4444` / `#fca5a5`），空頭用綠色系（`#22c55e` / `#86efac`）。

**理由**：Kite 主要服務台股使用者，視覺慣例一致性優先於國際慣例

### 4. MACD 警告整合在 Verdict 卡片內部

**決定**：「動能衰退中：日 MACD 紅柱連續縮短，不宜追漲」文字直接渲染在 Verdict「Caution - 觀察中」卡片的 `verdict.message` 下方，不另外建立獨立區塊。

**理由**：MACD 衰退是「Caution」狀態的補充說明，整合在同一卡片內更直觀

### 5. OFFICE 持股 MACD 轉弱時推送 Alert

**決定**：在 `portfolio_service.go` 的 `checkStrategyExitRules()` 中，為 STRONG_WEEKLY 與 WEEKLY_TREND 新增 `WEAKENING_BULL` 檢查。

**理由**：OFFICE 策略的核心紀律是「動能消失就離場」，MACD 轉弱是明確的訊號

## Risks / Trade-offs

- **首日資料無前一日** → 前端 `calculateMacdStatus` 對首筆回傳 `null`，後端需至少 11 筆 histogram 資料
- **週 K / 月 K** → 前端 `calculateMacdStatus` 在不同 timeframe 下正常運作，後端 `macd_trend_status` 僅反映日 K
- **MACD Alert 可能重複** → Discord 通知有 duplicate check 機制（`notification_logs`），24 小時內不重複推送

## Migration Plan

1. 後端 `calculateMACD()` 新增第三個回傳值（無破壞性，新增欄位）
2. 前端 `types.ts` 新增 `macd_trend_status`（新增欄位，舊前端不受影響）
3. 前端 UI 新增視覺元素（不移除現有邏輯）

Rollback：後端還原 `calculateMACD()` 簽名、移除 `MacdTrendStatus` 欄位；前端移除 `macdUtils.ts` import 並還原色碼邏輯。

## Open Questions (已解決)

- ~~`calculateMaCDDays.ts` 的 off-by-one 問題是否本次修正？~~ → 不修正，避免 scope 擴大
- ~~MACD 狀態從哪裡來？~~ → 後端直接計算回傳 `macd_trend_status`
- ~~MACD 警告放在哪裡？~~ → 整合在 Verdict 卡片內部
