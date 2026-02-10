# Nexus Project TODO List

> **Last Updated**: 2026-02-10
> **當前焦點**: LifeOS 進階功能（Skincare Strategy）

---

## ✅ 已完成 (Completed)

### Kite 模組 - 核心功能
- [x] Wind Cockpit（風型記錄 + 結構計算 + 門燈）
- [x] Stock Inspector（個股分析 + 策略診斷）
- [x] K 線圖表（日/週/月 K）
- [x] MACD Engine（日/週趨勢計算）
- [x] Watchlist（觀察清單 CRUD）
- [x] Trade Journal（交易記錄）
- [x] Trade History（歷史績效 + 統計）
- [x] 匯入歷史交易功能
- [x] Railway + Docker 部署
- [x] SQLite 持久化（Volume）

### Kite 模組 - 優先功能增強 (2026-01-23)
- [x] **Watchlist → Trade 轉換**：一鍵從觀察清單進場，自動預填數據
- [x] **即時價格更新**：Portfolio 30秒自動刷新 + 手動刷新控制
- [x] **進階分析儀表板**：
  - [x] 策略績效分組（勝率、損益、交易次數）
  - [x] 月度績效圖表（橫條圖視覺化）
  - [x] 平均持有天數統計
- [x] **移動端 UI 優化**：
  - [x] 44x44px 觸控目標標準
  - [x] iOS zoom 防止（16px font-size）
  - [x] Modal 滾動優化
  - [x] 響應式間距調整

### Kite 模組 - UI/UX 修復 (2026-01-23)
- [x] History 匯入表單寬度溢出修復
- [x] 統一策略 Icon 顯示
- [x] Watchlist BOSS 策略 YOY>30% 預設勾選
- [x] Active 平倉彈窗垂直居中修復
- [x] Wind 歷史循環 API 持久化（已驗證）

### Kite 模組 - Discord 通知系統 (2026-02-06)
- [x] Discord Webhook 基礎設施整合
- [x] Portfolio 警報（停損/停利/強制賣出/策略規則）
- [x] Watchlist 警報（目標價/策略條件）
- [x] 後台掃描器（3 分鐘輪詢）
- [x] 防重複通知機制（24 小時去重）
- [x] 全面 Logging（調試追蹤）
- [x] URL 解析錯誤修復（strings.TrimSpace）
- [x] 前端警報彈窗防重複顯示

### LifeOS 模組 - MVP 完成 (2026-02-08)
- [x] Habit Tracker 完整 CRUD（新增/編輯/刪除習慣、每日打卡）
- [x] Todo Board 完整 CRUD（新增/編輯/刪除任務、Quick Add）
- [x] Kanban 拖拉移動（原生 HTML5 Drag & Drop）
- [x] Habit Heatmap（GitHub 風格 16 週熱力圖）
- [x] Overview Stats（4 指標統計卡片）
- [x] War Room 戰情室（跨模組 Kite + LifeOS 整合面板）
  - [x] Kite 摘要：P&L、持倉數、策略警報、風型、門燈
  - [x] LifeOS 摘要：今日習慣、最長連勝、待辦、本週完成
  - [x] 快速行動按鈕（跨模組導航）
  - [x] 盤中 30 秒自動刷新 + Kite 離線 graceful degradation
- [x] 字型統一修復（Modal 元件 font-family 繼承）
- [x] 習慣名稱文字溢出修復（flex + text-overflow: ellipsis）
- [x] F.L.O.W. 分類系統（Focus / Leverage / Optimize / Waste 標籤）
- [x] 每週執行力統計（FlowStats 元件 + 4 週趨勢圖）

### LifeOS 模組 - 手機版跑版修復 (2026-02-09)
- [x] 主容器 padding 2rem→1rem（640px 斷點）
- [x] HabitHeatmap 溢出修復（overflow-x: auto + 380px 極小螢幕斷點）
- [x] FLOW Selector 手機 2x2 網格排列
- [x] WarRoom Quick Action 小螢幕字體縮放
- [x] 全元件 box-sizing + overflow 防溢出

### LifeOS 模組 - Discord 通知/提醒系統 (2026-02-10)
- [x] 共用 Discord Webhook Package 抽離（`pkg/discord/`）
- [x] Kite `discord_service.go` 重構使用共用 package
- [x] LifeOS 專用 Webhook（`DISCORD_LIFEOS_WEBHOOK_URL`，fallback 通用 URL）
- [x] 背景 Reminder Scanner（30 分鐘輪詢）
- [x] 習慣每日打卡提醒（預設 21:00，彙整未完成清單）
- [x] 任務即將到期提醒（預設 09:00，提前 1 天，逐筆通知）
- [x] 逾期任務彙總提醒（預設 09:00，每日一則）
- [x] 每日去重機制（per calendar day `ref_date`）
- [x] Reminder Settings API（GET/PUT `/api/lifeos/reminders`）
- [x] 前端 ReminderSettings Modal（齒輪 icon → 設定面板）
- [x] Dockerfile 加入 `tzdata`（Asia/Taipei 時區支援）

### 基礎建設
- [x] Go + Gin 後端架構
- [x] React + TypeScript 前端
- [x] Vite 開發環境
- [x] 模組化單體架構（Kite/LifeOS/ChoiceFit 資料夾）

---

## 🔴 立即處理 (Immediate)

### Kite UI 改進
- [ ] **替換原生 Emoji 為 SVG Icon**：統一視覺風格，支持自訂顏色
- [ ] **MACD 精度**：修正 `calculateMACDDays` 的 off-by-one 錯誤（如有）
- [ ] **週趨勢邏輯**：改用 MACD DIF（藍線）斜率判斷，避免「週三假訊號」（如需）

---

## 🟡 短期目標 (Short-Term)

### Kite 功能增強
- [x] **Portfolio View 強化**：
  - [x] 即時盈虧更新（30秒自動刷新）
  - [x] 策略條件監控（停損/停利警示）
- [x] **即時通知系統**：
  - [x] Discord Webhook 整合 ✅ (2026-02-06)
  - [x] 停損/停利觸發通知 ✅
  - [x] 觀察清單目標價到達通知 ✅
  - [x] 策略規則警示通知 ✅
  - [x] 防重複通知機制（24 小時去重）✅
  - [x] 後台掃描器（3 分鐘輪詢）✅
  - [x] 全面 Logging 與錯誤追蹤 ✅
  - [ ] LINE Notify / Telegram Bot 串接（未來擴展）
- [ ] **資料品質**：
  - [ ] Smart Suffix Retry（.TW vs .TWO 自動偵測上市/櫃）
  - [ ] 中文公司名稱自動抓取穩定化
- [x] **策略護欄**：
  - [x] BOSS 策略批次建議（10-15 批）- 已在轉換時自動設定
  - [x] OFFICE 策略批次建議（3-5 批）- 已在轉換時自動設定

### LifeOS 模組 MVP ✅ (2026-02-08)
- [x] **Habit Tracker 後端**：
  - [x] `Habit` Model 建立 ✅
  - [x] CRUD API 實作 ✅
  - [x] HabitLog 打卡 API ✅
- [x] **Todo Board 後端**：
  - [x] `Task` Model 建立 ✅
  - [x] Kanban 狀態管理 API ✅
  - [x] Move Task API ✅
- [x] **Habit Tracker 前端** ✅：
  - [x] 習慣清單顯示 + CRUD Modal
  - [x] 打卡介面（每日 toggle）
  - [x] Streak 視覺化（X day streak badge）
  - [x] GitHub 風格 Heatmap 熱力圖
- [x] **Todo Board 前端** ✅：
  - [x] Kanban 拖拉介面（HTML5 DnD）
  - [x] Quick Add 快速新增
  - [x] 優先級視覺化（!!!、normal、Low badge）
- [x] **War Room Dashboard** ✅：
  - [x] 跨模組監控面板（Kite P&L + 門燈 + LifeOS 指標）
  - [x] 快速行動按鈕（跨模組導航）
  - [x] 盤中自動刷新 + 離線 graceful degradation
- [ ] **LifeOS 進階功能**：
  - [x] F.L.O.W. 分類標籤 ✅ (2026-02-08)
  - [x] 每週執行力統計 ✅ (2026-02-08)
  - [x] 手機版跑版修復（6 檔案全面響應式修復）✅ (2026-02-09)
  - [x] Discord 通知/提醒系統 ✅ (2026-02-10)
  - [ ] **Skincare Strategy（生理週期保養策略）**
  - [ ] 完成動畫（Confetti / Checkmark）
  - [ ] Freeze 卡（暫停不中斷 streak）

### LifeOS Skincare Strategy（生理週期保養策略）
- [ ] **後端 — 週期引擎**：
  - [ ] `GenerateDailySkincare(cycleDay int)` 核心函數
  - [ ] 4 階段邏輯（Menstrual / Follicular / Ovulation / Luteal）
  - [ ] 全域規則守門員（Retinol 頻率、酸類限制、儀器衝突檢查）
  - [ ] AM / PM 分離的產品推薦 + Badge 警語
- [ ] **後端 — API**：
  - [ ] `GET /api/lifeos/skincare/today` — 今日保養建議
  - [ ] `GET /api/lifeos/skincare/week` — 本週保養排程
  - [ ] `PUT /api/lifeos/skincare/cycle` — 設定週期起始日
- [ ] **前端 — Skincare 頁面**：
  - [ ] LifeDashboard 新增 Skincare tab
  - [ ] 今日 AM/PM 保養清單（含 Badge 警語）
  - [ ] 週期相位指示器（Day X / Phase Name）
  - [ ] 週排程概覽

---

## 🟢 長期目標 (Long-Term)

### ChoiceFit 模組
- [ ] **學員管理系統**：
  - [ ] User Model（含 Role: ADMIN/STUDENT/TA）
  - [ ] 登入/驗證機制
  - [ ] 學員 Dashboard
- [ ] **訓練追蹤**：
  - [ ] 課表管理
  - [ ] 進度記錄
  - [ ] 遊戲化升級系統

### RBAC 權限控管
- [ ] **階段 2 實作**：
  - [ ] `Users` 表格建立
  - [ ] Auth Middleware（守門員）
  - [ ] 路由保護（/api/kite/* → ADMIN only）


---

## 🛠️ 基礎建設 & 開發流程

- [ ] **AdminRoute 保護**：`/admin` 路徑需驗證
- [ ] **自動化流程**：Autopilot Protocol（Implement → Verify → Commit）
- [ ] **測試覆蓋**：
  - [ ] 後端 API 單元測試
  - [ ] 前端元件測試
- [ ] **文件維護**：
  - [x] CLAUDE.md（AI 協作指南）
  - [x] PRODUCT.md（產品文件）
  - [x] TODO.md（開發路線圖）

---

## 📋 開發守則提醒

1. **Discipline > Analysis**：優先實作「守門員邏輯」（阻擋壞交易）而非「視覺分析」（花俏圖表）
2. **模組隔離**：模組之間不得互相 import，只能共用 `/pkg`（Go）或 `/src/shared`（React）
3. **Mobile First**：交易時間用手機看，版面必須響應式
4. **持久化優先**：新 Entity 必須加入 `AutoMigrate`，存入 `/app/data/nexus.db`

---

*每完成一項請更新此文件，保持同步*
