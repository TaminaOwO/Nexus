# Nexus Icon 遷移審計報告

> **產生日期**：2026-02-24
> **目的**：追蹤所有原生 Emoji → SVG Icon 的遷移進度
> **SVG 定義位置**：`src/components/Icons.tsx`

---

## 須更新未更新（已有 SVG 可用，但仍使用舊圖示）

| 位置 | File | Line | 目前使用 ICON | 預計更新 ICON |
|------|------|------|---------------|---------------|
| Kite - Alert Modal 關閉 | `TradeJournal.tsx` | 249 | `×` | [x] `XIcon` |
| Kite - Settle Modal 關閉 | `TradeJournal.tsx` | 284 | `×` | [x] `XIcon` |
| Kite - Import Modal 關閉 | `TradeHistory.tsx` | 285 | `×` | [x] `XIcon` |
| Kite - Trade Modal 關閉 | `StockInspector.tsx` | 274 | `×` | [x] `XIcon` |
| Kite - Wind Record Modal 關閉 | `WindCockpit.tsx` | 410 | `✕` | [x] `XIcon` |
| LifeOS - Task 刪除按鈕 | `TodoBoard.tsx` | 275 | `✕` | `TrashIcon` |
| LifeOS - Task Modal 關閉 | `TodoBoard.tsx` | 315 | `✕` | `XIcon` |
| LifeOS - Reminder Modal 關閉 | `ReminderSettings.tsx` | 132 | `✕` | `XIcon` |
| LifeOS - Habit 編輯按鈕 | `HabitTracker.tsx` | 233 | `✏️` | `EditIcon` (需新增) |
| LifeOS - Habit 刪除按鈕 | `HabitTracker.tsx` | 240 | `✕` | `TrashIcon` |
| LifeOS - Habit Modal 關閉 | `HabitTracker.tsx` | 268 | `✕` | `XIcon` |

**小計**：11 處

---

## 待更新（仍使用原生 Emoji，需設計新 SVG）

### Kite 模組 - Wind / Structure 系統

| 位置 | File | Line | 目前使用 ICON | 預計更新 ICON |
|------|------|------|---------------|---------------|
| 風型 STRONG | `types.ts` | 16 | 🦅 |  [x] `IconStrongWind` |
| 風型 TURBULENT | `types.ts` | 17 | 🌪️ |  [x] `IconTurbulence` |
| 風型 GUSTY | `types.ts` | 18 | 🍃 |  [x] `IconGust` |
| 風型 CALM | `types.ts` | 19 | 🐢 |  [x] `IconNoWind` |
| 結構 EASY_RISE | `types.ts` | 23 | 📈 | [x] `TrendingUpIcon` |
| 結構 EASY_FALL | `types.ts` | 24 | 📉 | [x] `TrendingDownIcon` |
| 結構 BOUNDARY | `types.ts` | 25 | 🌀 | [x] `CycleIcon` |
| WindCockpit 結構循環 | `WindCockpit.tsx` | 310 | `.emoji` ref | [x] `TrendingUpIcon` etc. |
| WindCockpit 結構大圖 | `WindCockpit.tsx` | 179 | `.emoji` ref | [x] `TrendingUpIcon` etc. |
| WindCockpit 風型選擇 | `WindCockpit.tsx` | 133 | `.emoji` ref | [x] `TrendingUpIcon` etc. |
| StockInspector 結構顯示 | `StockInspector.tsx` | 424 | `.emoji` ref | [x] `TrendingUpIcon` etc. |

### Kite 模組 - TradeHistory & Checklist

| 位置 | File | Line | 目前使用 ICON | 預計更新 ICON |
|------|------|------|---------------|---------------|
| 股票代碼 label | `TradeHistory.tsx` | 290 | 📊 | [x] `ChartLineIcon` |
| 策略 label | `TradeHistory.tsx` | 325 | 🎯 | [x] `TargetIcon` |
| 進場價 label | `TradeHistory.tsx` | 346 | 💰 | [x] `DollarSignIcon` |
| 出場價 label | `TradeHistory.tsx` | 412 | 💰 | [x] `DollarSignIcon` |
| 備註 label | `TradeHistory.tsx` | 434 | 📝 | [x] `BookOpenIcon` |
| Analytics 按鈕 | `TradeHistory.tsx` | 462 | 📊 | [x] `ChartLineIcon` |
| Win Rate stat | `TradeHistory.tsx` | 476 | 🎯 | [x] `TargetIcon` |
| Total P/L stat | `TradeHistory.tsx` | 481 | 💰 | [x] `ChartCandlestickIcon` |
| Strategy Performance | `TradeHistory.tsx` | 506 | 📊 | [x] `ChartLineIcon` |
| **子策略 Badge** | `Watchlist.tsx` | 335+ | ⚡/📉/🔄/🏷️ | [x] `StrongWeekIcon`, `WeeklyTrendIcon`, `WeeklyPullbackIcon`, `TagIcon` |
| **策略 Checklist** | `StrategyChecklist.tsx`| 42+ | ⚡/📉/🔄/🏷️ | [x] 同上 (StrongWeekIcon, WeeklyTrendIcon, WeeklyPullbackIcon, TagIcon) |

### Kite 模組 - Navigation

| 位置 | File | Line | 目前使用 ICON | 預計更新 ICON |
|------|------|------|---------------|---------------|
| Nav Tab "Active" | `index.tsx` | 72 | 📊 | `ChartLineIcon` |

### LifeOS 模組 - HabitTracker

| 位置 | File | Line | 目前使用 ICON | 預計更新 ICON |
|------|------|------|---------------|---------------|
| Streak 火焰 | `HabitTracker.tsx` | 208 | 🔥 | 需設計 `FlameIcon` |

### LifeOS 模組 - OverviewStats

| 位置 | File | Line | 目前使用 ICON | 預計更新 ICON |
|------|------|------|---------------|---------------|
| Habit stat icon | `OverviewStats.tsx` | 113 | 🎯 | `TargetIcon` |
| Streak stat icon | `OverviewStats.tsx` | 121 | 🔥 | 需設計 `FlameIcon` |
| Task stat icon | `OverviewStats.tsx` | 133 | 📋 | 需設計 `ClipboardIcon` |

### LifeOS 模組 - WarRoom

| 位置 | File | Line | 目前使用 ICON | 預計更新 ICON |
|------|------|------|---------------|---------------|
| 快速行動標題 | `WarRoom.tsx` | 437 | ⚡ | `ZapIcon` |
| 新增任務按鈕 | `WarRoom.tsx` | 446 | 📋 | 需設計 `ClipboardIcon` |
| 記錄習慣按鈕 | `WarRoom.tsx` | 452 | 🎯 | `TargetIcon` |
| 查看持倉按鈕 | `WarRoom.tsx` | 455 | 📊 | `ChartLineIcon` |

### LifeOS 模組 - Other

| 位置 | File | Line | 目前使用 ICON | 預計更新 ICON |
|------|------|------|---------------|---------------|
| Reminder 設定 icon | `ReminderSettings.tsx` | 14 | 📋 | 需設計 `ClipboardIcon` |
| Nav Tab "War Room" | `LifeDashboard.tsx` | 66 | ⚡ | `ZapIcon` |
| Skincare 經期階段 | `SkincareToday.tsx` | 16+ | 🩸🌸🌕🌙⏳ | 需設計 Phase Icons |

**小計**：~30 處

---

## 需新增的 SVG Icon 清單

| Icon 名稱 | 用途 | 參考風格 |
|-----------|------|----------|
| `EditIcon` | 編輯按鈕 | Lucide `pencil` |
| `FlameIcon` | Streak 火焰 | Lucide `flame` |
| `ClipboardIcon` | 任務/清單 | Lucide `clipboard-list` |
| `EagleIcon` | 風型 STRONG | 自訂鷹/上升圖示 |
| `TornadoIcon` | 風型 TURBULENT | 自訂漩渦圖示 |
| `LeafIcon` | 風型 GUSTY | Lucide `leaf` |
| `TurtleIcon` | 風型 CALM | 自訂龜圖示 |
| `TrendUpIcon` | 結構 EASY_RISE | Lucide `trending-up` |
| `TrendDownIcon` | 結構 EASY_FALL | Lucide `trending-down` |
| `CycleIcon` | 結構 BOUNDARY | Lucide `refresh-cw` |
| Phase Icons (×5) | Skincare 階段 | 需設計月相/花/血滴 |

---

*此審計報告用於追蹤 Emoji → SVG 遷移進度，完成後請更新 KITE_SPECS.md 與 LIFEOS_SPECS.md*
