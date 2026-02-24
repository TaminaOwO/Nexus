# Nexus Project TODO List

> **Last Updated**: 2026-02-24
> **當前焦點**: Kite UI 優化 & LifeOS 增強

---

## ✅ 已完成 (Completed)

### 基礎建設 & 安全
- [x] API 權限控管 (Auth / RBAC) ✅ (2026-02-15)
- [x] JWT / Session 驗證機制 ✅
- [x] Google OAuth2 登入整合 ✅
- [x] 前端 Login 頁面 ✅
- [x] API 路由保護 (Middleware) ✅

### Kite 模組 - 核心功能
- [x] Wind Cockpit（風型記錄 + 結構計算 + 門燈）
- [x] Stock Inspector（個股分析 + 策略診斷）
- [x] K 線圖表（日/週/月 K）
- [x] MACD Engine（日/週趨勢計算）
- [x] Watchlist（觀察清單 CRUD）
- [x] Trade Journal（交易記錄）
- [x] Trade History（歷史績效 + 統計）
- [x] 匯入歷史交易功能
- [x] Portfolio View 強化（即時刷新 + 停損停利監控）

### Kite 模組 - 通知系統
- [x] Discord Webhook 基礎設施整合
- [x] Portfolio / Watchlist 警報掃描器
- [x] 防重複通知機制

### LifeOS 模組 - MVP
- [x] Habit Tracker (CRUD + Heatmap)
- [x] Todo Board (Kanban + FLOW)
- [x] War Room 戰情室 (Kite + LifeOS 整合)
- [x] Discord 提醒系統 (習慣打卡 / 任務到期)
- [x] Skincare Strategy (週期保養引擎) ✅ (2026-02-11)

---

## 🔴 立即處理 (Immediate)

### Kite UI 改進
- [ ] **替換原生 Emoji 為 SVG Icon**：統一使用 `Icons.tsx` 中的元件
- [ ] **MACD 精度驗證**：檢查連續紅/綠天數計算邏輯

### LifeOS 引擎修復
- [ ] **Skincare 延期邏輯**：修正實際經期晚於預測時，自動進入經期的問題（應增加「延遲/待確認」狀態）

---

## 🟡 短期目標 (Short-Term)

### LifeOS 增強
- [ ] **Freeze 卡功能**：實作連續紀錄保護機制（類似 DuoLingo）
- [ ] **完成動畫**：習慣達成時的 Confetti / Checkmark 效果

### 資料品質
- [ ] Smart Suffix Retry (.TW vs .TWO) 穩定化
- [ ] 中文公司名稱自動抓取優化


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
