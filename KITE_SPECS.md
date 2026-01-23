# KITE_SPECS.md - 股票交易模組規格

> **模組路由**：`/kite`
> **資料表前綴**：`kite_` (建議)
> **狀態**：✅ 完成

---

## 1. 核心交易哲學：風、結構、門

### 🌬️ Wind（風）- 當日市場狀態

由 `WindCockpit` 元件監控，每日手動記錄。

```typescript
type WindType = "STRONG" | "TURBULENT" | "GUSTY" | "CALM";
```

| 風型 | 圖示 | 意義 | 市場特徵 |
|------|------|------|----------|
| **STRONG** | 🦅 | 強風 | 大盤強勁，適合順勢 |
| **TURBULENT** | 🌪️ | 亂流 | 波動劇烈，易洗盤 |
| **GUSTY** | 🍃 | 陣風 | 小幅波動，方向不明 |
| **CALM** | 🐢 | 無風 | 冷清或緩跌 |

### 📊 Structure（結構）- 市場週期

根據最近 **5 個交易日**的風型分布自動計算。

```typescript
type StructureType = "EASY_RISE" | "EASY_FALL" | "BOUNDARY";
```

| 結構 | 判定條件 | 操作傾向 |
|------|----------|----------|
| **EASY_RISE** (易漲) | 多數天為 STRONG/TURBULENT | 偏多操作 |
| **EASY_FALL** (易跌) | 多數天為 GUSTY/CALM | 偏空/觀望 |
| **BOUNDARY** (盤整) | 多空混雜 | 區間操作 |

### 🚦 Gate Light（門燈）- 進場信號

綜合 Wind + Structure 產生進場判斷。

| 燈號 | 條件 | 行動準則 |
|------|------|----------|
| 🟢 **GREEN** | EASY_RISE + STRONG | **允許大膽進場 (OFFICE 策略)** |
| 🟡 **YELLOW** | 混合信號 / BOUNDARY | **謹慎/觀望 (BOSS 策略為主)** |
| 🔴 **RED** | EASY_FALL 或 CALM | **禁止進場 / 空手** |

---

## 2. 策略系統 (Strategy)

### OFFICE 🏢 上班族型 - 動能追價

**適用條件**：Gate = GREEN / Structure = EASY_RISE
**核心邏輯**：追漲動能股，快進快出

| 子策略 | 代碼 | 觸發條件 | 操作方式 |
|--------|------|----------|----------|
| 週線強勢 | `STRONG_WEEKLY` | 週線 MACD 金叉 + 量增 | 追漲買入 |
| 週趨勢 | `WEEKLY_TREND` | 多頭排列 + 拉回不破支撐 | 買拉回 |

**CSS 識別**：
```css
--office-primary: #6366f1; /* 紫色系 */
```

### BOSS 🛡️ 老闆型 - 價值佈局

**適用條件**：Gate = YELLOW/RED / Structure ≠ EASY_RISE
**核心邏輯**：逢低佈局價值股，分批建倉

| 子策略 | 代碼 | 觸發條件 | 操作方式 |
|--------|------|----------|----------|
| 週拉回 | `WEEKLY_PULLBACK` | 週線回測支撐 + RSI < 30 | 分批承接 |
| 廉價收購 | `CHEAP_ACQUISITION` | 低本益比 / 高殖利率 | 長期持有 |

**CSS 識別**：
```css
--boss-primary: #f59e0b; /* 金色系 */
```

### 策略護欄建議

| 策略 | 建議批次 | 停損門檻 |
|------|----------|----------|
| OFFICE | 3-5 批 | -5% 出場 |
| BOSS | 10-15 批 | -10% 減碼 |

---

## 3. 技術指標計算

### MACD Engine

**位置**：`src/apps/kite/utils/calculateMACDDays.ts`

```typescript
interface MACDResult {
  dif: number;      // 快線 - 慢線
  macd: number;     // DIF - DEA
  dea: number;      // DIF 的 9 日 EMA
  histogram: number; // 柱狀圖 (MACD)
}
```

**已知問題 (from TODO)**：
- [ ] **精度問題**：`calculateMACDDays` 有 off-by-one 錯誤待修正
- [ ] **週趨勢邏輯**：改用 DIF（藍線）斜率判斷，避免「週三假訊號」

### K 線時間框架

| 時間框架 | 端點 | 資料來源 |
|----------|------|----------|
| 日 K | `/api/kite/chart/:symbol?timeframe=daily` | Fugle API |
| 週 K | `/api/kite/chart/:symbol?timeframe=weekly` | Fugle API (需多批取) |
| 月 K | `/api/kite/chart/:symbol?timeframe=monthly` | Fugle API (需多批取) |

---

## 4. 資料來源整合

### Fugle API

**用途**：K 線歷史資料
**注意事項**：
- 有日期範圍限制，需分批取資料
- 上市/櫃後綴判斷：`.TW` (上市) / `.TWO` (櫃買)
- Rate Limit 需控制

### TWSE API

**用途**：即時報價
**注意事項**：
- 中文公司名稱自動抓取

---

## 5. 元件清單

| 元件 | 檔案 | 功能 |
|------|------|------|
| `WindCockpit` | `WindCockpit.tsx` | 風型記錄 + 結構顯示 + 門燈 |
| `StockInspector` | `StockInspector.tsx` | 個股分析 + K線圖 + 策略診斷 |
| `StockChart` | `StockChart.tsx` | K線圖表 (日/週/月) |
| `Watchlist` | `Watchlist.tsx` | 觀察清單管理 |
| `TradeJournal` | `TradeJournal.tsx` | 進行中交易 |
| `TradeHistory` | `TradeHistory.tsx` | 歷史績效 |

---

## 6. API 端點

```
GET    /api/kite/quote/:symbol     # 即時報價
GET    /api/kite/chart/:symbol     # K線資料
GET    /api/kite/watchlist         # 觀察清單
POST   /api/kite/watchlist         # 新增觀察
PUT    /api/kite/watchlist/:id     # 更新觀察
DELETE /api/kite/watchlist/:id     # 刪除觀察
GET    /api/kite/journal           # 交易記錄
POST   /api/kite/journal           # 新增交易
GET    /api/kite/portfolio         # 持倉
GET    /api/kite/history           # 歷史績效
GET    /api/kite/wind              # 風型記錄
POST   /api/kite/wind              # 記錄風型
```

---

## 7. 待辦與優化 (from TODO)

### 立即處理
- [ ] **Wind 持久化**：確保風型記錄存入 `WindRecord` 表格
- [ ] **MACD 精度**：修正 `calculateMACDDays` 誤差
- [ ] **週趨勢邏輯**：DIF 斜率判斷

### 短期目標
- [ ] **即時盈虧更新頻率優化**
- [ ] **停損/停利觸發通知**（LINE Notify / Telegram）
- [ ] **Smart Suffix Retry**：.TW vs .TWO 自動偵測

---

## 8. UI 特別規範

### K 線圖
- 手機版需優化觸控縮放
- 橫屏模式支援

### 策略標籤
```css
.strategy-badge.office {
  background: var(--office-primary);
  color: white;
}

.strategy-badge.boss {
  background: var(--boss-primary);
  color: white;
}
```

### 價格顯示
```css
.price-display.up { color: var(--success); }   /* 綠 - 漲 */
.price-display.down { color: var(--danger); }  /* 紅 - 跌 */
```

---

*最後更新：2026-01-23*
