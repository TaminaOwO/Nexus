# Nexus Project TODO List

> **Last Updated**: 2026-02-24
> **當前焦點**: Kite UI 專業化完成 → LifeOS 凍結卡完成 → ChoiceFit & RBAC 進階實作

---



### 待處理功能
- [x] **Todo Board CRUD API**：建立 Task Model 與看板 API
- [x] **MACD 精度**：修正 `calculateMACDDays` 的 off-by-one 錯誤（後端修正完成）
- [x] **週趨勢邏輯**：改用 MACD DIF（藍線）斜率判斷，避免「週三假訊號」

---

## 🟡 短期目標 (Short-Term)

### Kite 功能增強
- [x] **Portfolio View 強化**：
  - [x] 即時盈虧更新（30秒自動刷新）
  - [x] 策略條件監控（停損/停利警示）
- [x] **即時通知系統**：
  - [x] 停損/停利觸發通知
  - [x] 觀察清單目標價到達通知
  - [x] Discord Webhook 串接
- [x] **資料品質**：
  - [x] Smart Suffix Retry（.TW vs .TWO 自動偵測上市/櫃）
  - [x] 中文公司名稱自動抓取穩定化
- [x] **策略護欄**：
  - [x] BOSS 策略批次建議（10-15 批）- 已在轉換時自動設定
  - [x] OFFICE 策略批次建議（3-5 批）- 已在轉換時自動設定

### LifeOS 模組 MVP
- [x] **Habit Tracker 後端**：
  - [x] `Habit` Model 建立 (含 FreezeCards)
  - [x] CRUD API 實作
  - [x] Streak 計算邏輯 (支援 Frozen 狀態)
- [x] **Todo Board 後端**：
  - [x] `Task` Model 建立
  - [x] Kanban 狀態管理 API
- [x] **War Room Dashboard**：
  - [x] 跨模組監控面板（Kite + LifeOS 指標）
- [x] **Skincare 保養策略引擎更新**：
  - [x] 修正週期判定與介面相容 (`ovulation`, 兩段式 `luteal`)
  - [x] 加入新產品自訂排程 (Arencia, Stridex 等) 與衝突判定 (Stridex vs Arencia/Torriden 等)

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
