# LifeOS 戰術引擎規格書 (Technical Spec v1.0)

> **專案代號**：Nexus / LifeOS  
> **模組名稱**：Task Engine (F.L.O.W. Edition)  
> **負責人**：Tamina (Commander)  
> **狀態**：開發中 (In Development)
> **最後更新**：2026-02-24

---

## 1. 產品願景 (Product Vision)

打造一個專屬於「一人創業者 (Solopreneur)」的任務管理系統。

不同於傳統 To-Do List 僅關注「事情做完沒」，本系統核心價值在於**「戰略校準」**——透過 F.L.O.W. 分類法，強制使用者意識到自己當下的行動是在「做雜事 (Operate)」還是在「建資產 (Leverage)」。

### 核心目標

| 目標 | 說明 |
|------|------|
| **視覺化督促** | 透過能量條顯示本週戰力分佈（F/L/O/W） |
| **極簡管理** | 看板 (Kanban) 模式，拖拉管理狀態 |
| **戰情整合** | 未來與 Kite 交易數據並列於 War Room |

**設計哲學**：
- 不追求複雜功能，重點在於「聚焦」與「簡單」
- 降低嚴肅感，增加「個人手帳」的溫度
- 與 Kite 的硬派財經風格做出區隔

---

## 2. 核心功能範疇 (Scope)

### 2.1 資料結構：F.L.O.W. 屬性系統

必須支援以下四種核心分類，這將是未來儀表板的統計基礎：

| 代碼 | 名稱 | 定義 (Definition) | 範例 |
|------|------|-------------------|------|
| **F** | Funnel / Framework | 定義與規劃：將模糊想法轉化為 SOP 或規則 | 規劃交易策略、設計健身課表、寫 Prompt |
| **L** | Leverage | 槓桿與資產：創造能重複使用的資產或工具 | 寫程式碼、錄製課程影片、開發自動化腳本 |
| **O** | Operate | 運營與優化：維持系統運作的必要勞動 | 每日盯盤、一對一教學、回覆訊息、修 Bug |
| **W** | Wealth | 變現與結果：直接產生現金流的行動 | 成交客戶、送出發票、結算獲利 |
| **N** | None | 生活瑣事：與事業成長無關的雜事 | 買貓砂、繳水電費、領包裹 |

### 2.2 任務看板 (Kanban)

| 屬性 | 選項 |
|------|------|
| **狀態流轉** | `TODO` (待辦) → `DOING` (進行中) → `DONE` (完成) |
| **優先級** | `HIGH` (高 - 戰略級)、`MEDIUM` (中)、`LOW` (低) |

---

## 3. 技術規格 (Technical Specification)

### 3.1 已實作資料庫模型

#### Habit Model (`internal/modules/lifeos/model/habit.go`)

```go
// Habit - 習慣定義
type Habit struct {
    ID           string    `gorm:"primaryKey" json:"id"`
    Name         string    `json:"name"`
    Frequency    string    `json:"frequency"`      // Daily / Weekly
    TargetStreak int       `json:"target_streak"`
    FreezeCards  int       `json:"freeze_cards"`   // 凍結卡數量，保護連勝
    Icon         string    `json:"icon"`
    Color        string    `json:"color"`
    CreatedAt    time.Time `json:"created_at"`
}

// HabitLog - 習慣記錄
type HabitLog struct {
    ID        string    `gorm:"primaryKey" json:"id"`
    HabitID   string    `json:"habit_id"`
    Date      string    `json:"date"`     // YYYY-MM-DD
    Status    string    `json:"status"`   // Done / Skipped / Missed / Frozen
    CreatedAt time.Time `json:"created_at"`
}
```

> **凍結卡機制 (2026-02-24)**：
> - `FreezeCards` 欄位記錄各習慣可用凍結卡數量
> - 使用凍結卡時，卡數 -1，該日記錄為 `Frozen` 狀態
> - `Frozen` 狀態計入連勝 (Streak) 計算，不會中斷連勝天數

#### Task Model (`internal/modules/lifeos/model/task.go`)

**注意**：當前實作使用簡化的 Kanban 欄位（backlog/this_week/today/done），與原規格的 F.L.O.W. 分類不同。

### 3.2 原規劃 Task Model（待重構）

**檔案路徑**：`internal/modules/lifeos/model/task.go`（未來版本）

```go
package model

import (
	"time"
)

// TaskStatus - 看板狀態
type TaskStatus string
const (
	StatusTodo  TaskStatus = "TODO"
	StatusDoing TaskStatus = "DOING"
	StatusDone  TaskStatus = "DONE"
)

// TaskPriority - 優先級
type TaskPriority string
const (
	PriorityLow    TaskPriority = "LOW"
	PriorityMedium TaskPriority = "MEDIUM"
	PriorityHigh   TaskPriority = "HIGH"
)

// FlowType - 創業者的戰略分類 (核心功能)
type FlowType string
const (
	FlowFunnel   FlowType = "F_FUNNEL"   // 定義規則/SOP
	FlowLeverage FlowType = "L_LEVERAGE" // 建立資產/Code
	FlowOperate  FlowType = "O_OPERATE"  // 維持運作/雜事
	FlowWealth   FlowType = "W_WEALTH"   // 變現結果
	FlowNone     FlowType = "NONE"       // 生活瑣事
)

type Task struct {
	ID          string       `gorm:"primaryKey" json:"id"` // UUID
	Title       string       `json:"title"`                // 任務標題
	Description string       `json:"description"`          // 備註/細節
	
	// 核心屬性
	Status      TaskStatus   `json:"status"`               // 看板欄位
	Priority    TaskPriority `json:"priority"`             // 視覺權重
	FlowType    FlowType     `json:"flow_type"`            // 戰略屬性
	
	// 時間管理
	DueDate     *time.Time   `json:"due_date"`             // 預計截止
	CompletedAt *time.Time   `json:"completed_at"`         // 用於計算每週執行力
	
	// 系統欄位
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}
```

### 3.3 已實作 API 介面

**Base URL**: `/api/lifeos`

#### Habit Endpoints
| Method | Endpoint | Description | Payload |
|--------|----------|-------------|---------|
| `GET` | `/habits` | 獲取習慣列表 | N/A |
| `POST` | `/habits` | 新增習慣 | `{ name, frequency, target_streak, freeze_cards, icon, color }` |
| `PUT` | `/habits/:id` | 更新習慣 | `{ name, target_streak, freeze_cards, icon, color }` |
| `DELETE` | `/habits/:id` | 刪除習慣 | N/A |
| `GET` | `/habits/:id/logs` | 獲取習慣記錄 | N/A |
| `POST` | `/habits/:id/check` | 打卡 | `{ date, status }` |
| `POST` | `/habits/:id/freeze` | 使用凍結卡 | `{ date }` |

#### Task Endpoints
| Method | Endpoint | Description | Payload |
|--------|----------|-------------|---------|
| `GET` | `/tasks` | 獲取任務列表 | N/A |
| `POST` | `/tasks` | 新增任務 | `{ title, column, priority, description, due_date, tags }` |
| `PUT` | `/tasks/:id` | 更新任務 | `{ title, description, priority, due_date, tags }` |
| `DELETE` | `/tasks/:id` | 刪除任務 | N/A |
| `PATCH` | `/tasks/:id/move` | 移動任務欄位 | `{ column, order }` |

### 3.4 原規劃 API（F.L.O.W. 版本）

**注意**：以下為原始規格，當前實作尚未包含 F.L.O.W. 分類

| Method | Endpoint | Description | Payload / Params |
|--------|----------|-------------|------------------|
| `GET` | `/tasks` | 獲取任務列表 | `?status=TODO&flow_type=L_LEVERAGE` (可選過濾) |
| `POST` | `/tasks` | 新增戰略任務 | `{ title, flow_type, priority, ... }` |
| `PUT` | `/tasks/:id` | 更新任務狀態 | `{ status: "DONE", completed_at: "..." }` |
| `DELETE` | `/tasks/:id` | 移除任務 | N/A |

### 3.5 資料庫遷移 (Migration)

**已完成**：在 `cmd/server/main.go` 中已註冊：
```go
database.DB.AutoMigrate(
    &lifeosModel.Habit{},
    &lifeosModel.HabitLog{},
    &lifeosModel.Task{},
    &lifeosModel.ReminderSetting{},
    &lifeosModel.LifeOSNotificationLog{},
    &lifeosModel.SkincareCycleSetting{},
    &lifeosModel.SkincareScheduleRule{},
)
```

---

## 4. 實作執行計畫 (Implementation Plan)

> 這是給 Agent 的執行指令清單，按順序執行可確保零錯誤。

### Phase 1: 後端核心 (Backend Core)

1. **建立目錄**：確認 `internal/modules/lifeos/` 下有 `model`, `handler`, `service` 資料夾
2. **定義 Model**：建立 `model/task.go` (如上)
3. **DB 註冊**：修改 `database/db.go` 加入 `AutoMigrate(&lifeosModel.Task{})`
4. **Service 層**：實作 `CreateTask`, `UpdateTask`, `DeleteTask`, `ListTasks`
   - **邏輯要求**：當狀態轉為 `DONE` 時，自動填入 `CompletedAt = time.Now()`
5. **Handler 層**：實作 HTTP 解析與回應
6. **路由註冊**：在 `cmd/server/main.go` 加入 `/api/lifeos` 路由群組
7. **驗證**：執行 `go build ./cmd/server` 確保編譯通過

### Phase 2: 前端對接 (Frontend Integration) - 待下一階段

> (本階段暫不實作，先確保 API 可用)

1. 定義 TypeScript Types (`src/apps/lifeos/types.ts`)
2. 建立 API Client (`src/apps/lifeos/api.ts`)
3. 實作 Kanban Board UI

---

## 5. 驗收標準 (Success Metrics)

| 項目 | 驗收條件 |
|------|----------|
| **編譯通過** | 後端程式碼無語法錯誤 |
| **資料庫生效** | 啟動 Server 後，SQLite 中出現 `tasks` 表格 |
| **API 測試** | 發送 `POST /tasks` 帶有 `flow_type: "L_LEVERAGE"` 能成功建立 |
| | 發送 `GET /tasks` 能看到剛建立的任務 |

---

## 6. 目前實作狀態 vs 原規劃差異

### ✅ 已完成
- [x] Habit Model 建立（`Habit` + `HabitLog` + `FreezeCards`）
- [x] Task Model 建立（簡化版 Kanban）
- [x] Habit CRUD API（7 個端點，含凍結卡）
- [x] Task CRUD API（5 個端點）
- [x] Database Migration（已註冊到 main.go）
- [x] API 路由註冊（`/api/lifeos`）
- [x] Streak 計算邏輯（支援 Done + Frozen 狀態）
- [x] 凍結卡功能 (Freeze Cards)：後端耗用 + 前端 UI
- [x] 打卡完成動畫（CSS Pop 動畫）
- [x] Skincare 模組（傳完整週期機制 + 「等候期」延遲處理）
- [x] Reminder 提醒系統（Discord Webhook）
- [x] 前端 Habit Tracker UI（含 Heatmap）

### ⚠️ 與原規劃差異
| 原規劃 | 當前實作 | 狀態 |
|--------|----------|------|
| F.L.O.W. 分類系統 | 簡化 Kanban（backlog/this_week/today/done） | 需重構 |
| FlowType (F/L/O/W/N) | 無此欄位 | 需新增 |
| TaskStatus (TODO/DOING/DONE) | Column (string) | 需對齊 |
| TaskPriority (HIGH/MEDIUM/LOW) | Priority (int 1-3) | 可用但需調整 |
| CompletedAt 自動填入 | 無此邏輯 | 需實作 |

### 🚧 進行中
- [ ] Task Model 重構為 F.L.O.W. 版本
- [ ] 前端 Todo Board UI 優化
- [ ] War Room Dashboard（跨模組整合）
- [ ] F.L.O.W. 統計視覺化

### 📝 待規劃
- [ ] 時間追蹤功能
- [ ] Pomodoro 整合
- [ ] 每週/每月回顧報告
- [ ] 遊戲化元素（經驗值、成就系統）

---

## 7. Skincare 模組 (2026-02-24)

### 功能概述
依據生理週期提供個人化護膚建議。

### 核心邏輯
- 支援 5 個週期階段：`menstrual` / `follicular` / `ovulation` / `luteal` / `waiting`
- `waiting` 階段：當週期天數超過預設週期長度時觸發，表示經期延遲
- 前端提供「確認經期開始」按鈕，允許手動重設週期起始日

### API 端點
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/skincare/cycle` | 獲取週期設定 |
| `PUT` | `/skincare/cycle` | 更新週期設定 |
| `GET` | `/skincare/today` | 今日護膚建議 |
| `GET` | `/skincare/week` | 本週護膚建議 |
| `GET` | `/skincare/schedule` | 獲取排程規則 |
| `PUT` | `/skincare/schedule` | 更新排程規則 |

---

*最後更新：2026-02-24*
