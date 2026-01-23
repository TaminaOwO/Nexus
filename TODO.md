# Nexus Project TODO List

> **Last Updated**: 2026-01-23
> **當前焦點**: Kite 模組優化完成 → LifeOS 核心 → ChoiceFit 初始化

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

### LifeOS 後端整合
- [ ] Habit Tracker 資料持久化
- [ ] Todo Board CRUD API

---

## 🟡 短期目標 (Short-Term)

### Kite 功能增強
- [x] **Portfolio View 強化**：
  - [x] 即時盈虧更新（30秒自動刷新）
  - [ ] 策略條件監控（停損/停利警示）
- [ ] **即時通知系統**：
  - [ ] 停損/停利觸發通知
  - [ ] 觀察清單目標價到達通知
  - [ ] LINE Notify / Telegram Bot 串接
- [ ] **資料品質**：
  - [ ] Smart Suffix Retry（.TW vs .TWO 自動偵測上市/櫃）
  - [ ] 中文公司名稱自動抓取穩定化
- [x] **策略護欄**：
  - [x] BOSS 策略批次建議（10-15 批）- 已在轉換時自動設定
  - [x] OFFICE 策略批次建議（3-5 批）- 已在轉換時自動設定

### LifeOS 模組 MVP
- [ ] **Habit Tracker 後端**：
  - [ ] `Habit` Model 建立
  - [ ] CRUD API 實作
  - [ ] Streak 計算邏輯
- [ ] **Todo Board 後端**：
  - [ ] `Task` Model 建立
  - [ ] Kanban 狀態管理 API
- [ ] **War Room Dashboard**：
  - [ ] 跨模組監控面板（Kite + LifeOS 指標）

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
