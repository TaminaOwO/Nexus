# Nexus Project TODO List

> **Last Updated**: 2026-01-22  
> **當前焦點**: Kite 模組收尾 → LifeOS 核心 → ChoiceFit 初始化

---

## ✅ 已完成 (Completed)

### Kite 模組
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

### 基礎建設
- [x] Go + Gin 後端架構
- [x] React + TypeScript 前端
- [x] Vite 開發環境
- [x] 模組化單體架構（Kite/LifeOS/ChoiceFit 資料夾）

---

## 🔴 立即處理 (Immediate)

### Kite 修復與優化
- [ ] **Wind 持久化**：確保風型記錄存入 `WindRecord` 表格，重載頁面後保留
- [ ] **MACD 精度**：修正 `calculateMACDDays` 的 off-by-one 錯誤
- [ ] **週趨勢邏輯**：改用 MACD DIF（藍線）斜率判斷，避免「週三假訊號」

### Mobile UI 優化
- [x] 響應式底部導航（手機版）
- [x] 觸控友善的按鈕大小（min 48px）
- [x] K 線圖表手機版佈局調整

---

## 🟡 短期目標 (Short-Term)

### Kite 功能增強
- [ ] **Portfolio View 強化**：
  - [ ] 即時盈虧更新頻率優化
  - [ ] 策略條件監控（停損/停利警示）
- [ ] **即時通知系統**：
  - [ ] 停損/停利觸發通知
  - [ ] 觀察清單目標價到達通知
  - [ ] LINE Notify / Telegram Bot 串接
- [ ] **資料品質**：
  - [ ] Smart Suffix Retry（.TW vs .TWO 自動偵測上市/櫃）
  - [ ] 中文公司名稱自動抓取穩定化
- [ ] **策略護欄**：
  - [ ] BOSS 策略批次建議（10-15 批）
  - [ ] OFFICE 策略批次建議（3-5 批）

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
