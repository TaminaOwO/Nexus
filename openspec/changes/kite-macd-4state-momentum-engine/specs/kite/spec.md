## MODIFIED Requirements

### Requirement: MACD 技術指標引擎

系統 MUST 提供 MACD 指標計算功能，支援日/週/月三個時間框架，並能判斷 4 種動能趨勢。

```typescript
type MacdTrendStatus = 'STRONG_BULL' | 'WEAKENING_BULL' | 'STRONG_BEAR' | 'WEAKENING_BEAR';

interface MACDResult {
  dif: number;       // 快線 - 慢線
  macd: number;      // DIF - DEA
  dea: number;       // DIF 的 9 日 EMA
  histogram: number; // 柱狀圖 (MACD)
  trendStatus: MacdTrendStatus; // 新增：與前一週期比較之動能狀態
  colorCode: string;            // 新增：對應之台股紅綠色碼
}
```

**色碼對應（台股紅漲綠跌慣例）**：
| 狀態 | 說明 | 色碼 |
|------|------|------|
| `STRONG_BULL` | histogram > 0 且 > 前日 | `#ef4444`（深紅） |
| `WEAKENING_BULL` | histogram > 0 且 < 前日 | `#fca5a5`（淺紅） |
| `STRONG_BEAR` | histogram < 0 且 < 前日 | `#22c55e`（深綠） |
| `WEAKENING_BEAR` | histogram < 0 且 > 前日 | `#86efac`（淺綠） |

**實作位置**：
- 計算：`src/apps/kite/utils/calculateMACDDays.ts`（現有）
- 狀態判定：`src/apps/kite/utils/macdUtils.ts`（新增）

**已知問題**：
- `calculateMACDDays` 有 off-by-one 精度問題待修正（本次不處理）
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
- AND 該股之 MACD 狀態為 `WEAKENING_BULL`（histogram > 0 且 < 前日）
- THEN 系統 MUST 在畫面上顯示 `AlertTriangleIcon` 警告標示
- AND 介面 SHALL 顯示「動能衰退，不宜追價」文字提示，擋下不當追高
