## Context

Kite 模組目前透過 `calculateMACDDays.ts` 計算 DIF、DEA、Histogram，但 `MACDResult` 僅回傳數值，無狀態語義。`StockChart` 使用固定正/負色判斷柱狀體顏色，無法反映「增強 vs 衰退」的差異。`StrategyChecklist` 目前也沒有針對 MACD 動能衰退的守門員邏輯。

## Goals / Non-Goals

**Goals:**
- 新增 `macdUtils.ts`，集中管理狀態常數、色碼、與 `calculateMacdStatus` 函式
- 擴充 `MACDResult` 加入 `trendStatus` 與 `colorCode`
- `StockChart` MACD 柱狀體改用四色渲染
- `StrategyChecklist` 在 OFFICE 策略 + `WEAKENING_BULL` 時注入警告 UI
- `Icons.tsx` 新增 `AlertTriangleIcon`

**Non-Goals:**
- 不修改後端 Go 計算邏輯（MACD 狀態為純前端計算）
- 不改動 DB schema
- 不影響 LifeOS / ChoiceFit 模組

## Decisions

### 1. 新增獨立 `macdUtils.ts` 而非修改 `calculateMACDDays.ts`

**決定**：建立 `src/apps/kite/utils/macdUtils.ts`，僅負責狀態判定與色碼對應。

**理由**：
- 保持 `calculateMACDDays.ts` 的數值計算職責不變，避免觸碰已知 off-by-one 問題
- `macdUtils.ts` 可獨立測試，狀態邏輯與計算邏輯解耦
- 未來若需要修正 off-by-one 時，不需同時處理狀態邏輯

**備選方案**：直接在 `calculateMACDDays.ts` 內加狀態 → 拒絕，因為混合職責且風險較高

### 2. `calculateMacdStatus` 輸入為完整歷史序列

**決定**：函式接受 `histogram[]` 陣列，回傳每日對應的 `MacdTrendStatus[]`。

**理由**：
- 避免呼叫端需自行管理「前一日」index，降低 off-by-one 風險
- `StockChart` 已持有完整歷史資料，傳入陣列符合現有資料流

### 3. 色碼採台股慣用紅漲綠跌邏輯

**決定**：多頭用紅色系（`#ef4444` / `#fca5a5`），空頭用綠色系（`#22c55e` / `#86efac`）。

**理由**：Kite 主要服務台股使用者，視覺慣例一致性優先於國際慣例

### 4. `AlertTriangleIcon` 放置在 `src/components/Icons.tsx`

**決定**：遵循既有 Shared Icons 規範，不在 kite 模組內另建 icon

**理由**：符合 module isolation 原則，其他模組未來也可使用

## Risks / Trade-offs

- **首日資料無前一日** → `calculateMacdStatus` 對第一筆資料回傳 `null` 或預設 `STRONG_BULL`/`STRONG_BEAR`（依正負值決定），呼叫端需處理 null case
- **週 K / 月 K 資料流** → `StockChart` 在不同 timeframe 下取得的 histogram 陣列長度不同，需確認 index 對齊正確
- **OFFICE 策略判斷時機** → `StrategyChecklist` 需取得「最新一日」的 `trendStatus`；若資料尚未載入則不顯示警告（非阻擋式）

## Migration Plan

1. 新增 `macdUtils.ts` + `AlertTriangleIcon`（無破壞性）
2. 修改 `StockChart` 套用新色碼（視覺變更，功能不變）
3. 修改 `StrategyChecklist` 加入守門員邏輯（僅新增 UI，不移除現有邏輯）

Rollback：移除 `macdUtils.ts` import，還原 `StockChart` 色碼邏輯即可回到原狀態。

## Open Questions

- `calculateMaCDDays.ts` 的 off-by-one 問題是否在本次一併修正？（本次暫不修正，避免 scope 擴大）
- BOSS 策略是否需要對 `WEAKENING_BEAR`（空頭收斂）也加入提示？（本次僅處理 OFFICE 守門員，BOSS 留作後續 change）
