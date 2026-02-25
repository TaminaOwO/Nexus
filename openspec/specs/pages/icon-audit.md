# Nexus Icon 遷移審計規格

> **目的**：追蹤所有原生 Emoji → SVG Icon 的遷移進度
> **SVG 定義位置**：`src/components/Icons.tsx`
> **最後更新**：2026-02-24
> **來源**：`design-system/nexus/pages/ICON_AUDIT.md`

---

## Requirements

### Requirement: Kite 模組已完成 Icon 遷移

Kite 模組中的 Modal 關閉按鈕 MUST 全部使用 `XIcon` SVG 元件替換原生 `×` / `✕` 字元。以下項目已完成遷移。

| 位置 | 檔案 | 舊圖示 | 新圖示 |
|------|------|--------|--------|
| Alert Modal 關閉 | `TradeJournal.tsx` | `×` | ✅ `XIcon` |
| Settle Modal 關閉 | `TradeJournal.tsx` | `×` | ✅ `XIcon` |
| Import Modal 關閉 | `TradeHistory.tsx` | `×` | ✅ `XIcon` |
| Trade Modal 關閉 | `StockInspector.tsx` | `×` | ✅ `XIcon` |
| Wind Record Modal 關閉 | `WindCockpit.tsx` | `✕` | ✅ `XIcon` |

#### Scenario: Kite Modal 關閉按鈕驗證

- WHEN 檢查 Kite 模組中任何 Modal 的關閉按鈕
- THEN 所有關閉按鈕 MUST 使用 `XIcon` SVG 元件
- AND MUST NOT 使用原生文字字元 `×` 或 `✕`

---

### Requirement: Kite Wind / Structure Icon 遷移

Kite 模組中的風型與結構圖示 MUST 從 Emoji 遷移為專業 SVG 元件。以下項目已完成遷移。

| 用途 | 舊圖示 | 新圖示 |
|------|--------|--------|
| 風型 STRONG | 🦅 | ✅ `IconStrongWind` |
| 風型 TURBULENT | 🌪️ | ✅ `IconTurbulence` |
| 風型 GUSTY | 🍃 | ✅ `IconGust` |
| 風型 CALM | 🐢 | ✅ `IconNoWind` |
| 結構 EASY_RISE | 📈 | ✅ `TrendingUpIcon` |
| 結構 EASY_FALL | 📉 | ✅ `TrendingDownIcon` |
| 結構 BOUNDARY | 🌀 | ✅ `CycleIcon` |

#### Scenario: Wind 類型圖示渲染

- WHEN 介面顯示風型選擇器或風型記錄
- THEN 系統 MUST 使用對應的 SVG 元件（如 `IconStrongWind`）
- AND MUST NOT 使用原生 Emoji

---

### Requirement: Kite TradeHistory 與 Checklist Icon 遷移

TradeHistory 與 StrategyChecklist 元件中的所有 Emoji MUST 替換為 SVG 元件。以下項目已完成遷移。

| 位置 | 舊圖示 | 新圖示 |
|------|--------|--------|
| 股票代碼 label | 📊 | ✅ `ChartLineIcon` |
| 策略 label | 🎯 | ✅ `TargetIcon` |
| 進場/出場價 label | 💰 | ✅ `DollarSignIcon` |
| 備註 label | 📝 | ✅ `BookOpenIcon` |
| Analytics 按鈕 | 📊 | ✅ `ChartLineIcon` |
| Win Rate stat | 🎯 | ✅ `TargetIcon` |
| Total P/L stat | 💰 | ✅ `ChartCandlestickIcon` |
| Strategy Performance | 📊 | ✅ `ChartLineIcon` |
| 子策略 Badge | ⚡/📉/🔄/🏷️ | ✅ SVG 子策略圖示 |

#### Scenario: TradeHistory 圖示驗證

- WHEN 使用者查看歷史交易頁面
- THEN 所有 label 與統計圖示 MUST 使用 SVG 元件
- AND MUST NOT 出現原生 Emoji

---

### Requirement: LifeOS 模組待遷移 Icon

LifeOS 模組中以下位置仍使用原生 Emoji 或文字字元，MUST 在後續迭代中替換為 SVG 元件。

| 位置 | 檔案 | 目前圖示 | 預計替換 |
|------|------|----------|----------|
| Task 刪除按鈕 | `TodoBoard.tsx` | `✕` | `TrashIcon` |
| Task Modal 關閉 | `TodoBoard.tsx` | `✕` | `XIcon` |
| Reminder Modal 關閉 | `ReminderSettings.tsx` | `✕` | `XIcon` |
| Habit 編輯按鈕 | `HabitTracker.tsx` | `✏️` | `EditIcon` (需新增) |
| Habit 刪除按鈕 | `HabitTracker.tsx` | `✕` | `TrashIcon` |
| Habit Modal 關閉 | `HabitTracker.tsx` | `✕` | `XIcon` |
| Streak 火焰 | `HabitTracker.tsx` | 🔥 | `FlameIcon` (需新增) |
| Habit stat icon | `OverviewStats.tsx` | 🎯 | `TargetIcon` |
| Streak stat icon | `OverviewStats.tsx` | 🔥 | `FlameIcon` (需新增) |
| Task stat icon | `OverviewStats.tsx` | 📋 | `ClipboardIcon` (需新增) |
| 快速行動標題 | `WarRoom.tsx` | ⚡ | `ZapIcon` |
| 新增任務按鈕 | `WarRoom.tsx` | 📋 | `ClipboardIcon` (需新增) |
| 記錄習慣按鈕 | `WarRoom.tsx` | 🎯 | `TargetIcon` |
| 查看持倉按鈕 | `WarRoom.tsx` | 📊 | `ChartLineIcon` |
| Reminder 設定 icon | `ReminderSettings.tsx` | 📋 | `ClipboardIcon` (需新增) |
| Nav Tab "War Room" | `LifeDashboard.tsx` | ⚡ | `ZapIcon` |
| Skincare 週期階段 | `SkincareToday.tsx` | 🩸🌸🌕🌙⏳ | Phase Icons (需設計) |

#### Scenario: LifeOS Icon 遷移執行

- WHEN 開發者執行 LifeOS Icon 遷移任務
- THEN 每個替換 MUST 使用 `src/components/Icons.tsx` 中定義的 SVG 元件
- AND 若缺少對應 SVG，MUST 先在 `Icons.tsx` 中新增定義

---

### Requirement: 需新增的 SVG Icon 清單

以下 SVG 元件 MUST 在 `src/components/Icons.tsx` 中新增，以支援完整的 Icon 遷移。

| Icon 名稱 | 用途 | 參考風格 |
|-----------|------|----------|
| `EditIcon` | 編輯按鈕 | Lucide `pencil` |
| `FlameIcon` | Streak 火焰 | Lucide `flame` |
| `ClipboardIcon` | 任務/清單 | Lucide `clipboard-list` |
| Phase Icons (×5) | Skincare 週期階段 | 需設計月相/花/血滴等 |

#### Scenario: 新增 SVG 定義

- WHEN 需要新增一個 SVG Icon 元件
- THEN 開發者 MUST 在 `src/components/Icons.tsx` 中定義
- AND Icon MUST 遵循 Lucide 風格（24x24 viewBox, 2px stroke）
- AND 元件 SHALL 接受 `size` 和 `color` props
