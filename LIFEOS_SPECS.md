# LIFEOS_SPECS.md - 生活管理模組規格

> **模組路由**：`/admin` (或 `/lifeos`)
> **資料表前綴**：`lifeos_` (建議)
> **狀態**：✅ MVP 完成 (2026-02-08)

---

## 1. 模組願景

LifeOS 是 Nexus 的**生活管理中樞**，讓 Tamina 在一個地方追蹤習慣、管理任務、掌握人生儀表板。

**設計哲學**：
- 不追求複雜功能，重點在於「聚焦」與「簡單」
- 降低嚴肅感，增加「個人手帳」的溫度
- 與 Kite 的硬派財經風格做出區隔

---

## 2. 核心功能模組

### A. Habit Tracker（習慣追蹤）

**目標**：建立長期穩定的原子習慣

#### 資料模型

```go
// Habit - 習慣定義
type Habit struct {
    ID           string    `gorm:"primaryKey" json:"id"`
    Name         string    `json:"name"`           // 習慣名稱
    Frequency    string    `json:"frequency"`      // Daily / Weekly
    TargetStreak int       `json:"target_streak"`  // 目標連續天數
    Icon         string    `json:"icon"`           // 圖示 (SVG name)
    Color        string    `json:"color"`          // 識別顏色
    CreatedAt    time.Time `json:"created_at"`
}

// HabitLog - 習慣記錄
type HabitLog struct {
    ID        string    `gorm:"primaryKey" json:"id"`
    HabitID   string    `json:"habit_id"`
    Date      string    `json:"date"`             // YYYY-MM-DD
    Status    string    `json:"status"`           // Done / Skipped / Missed
    CreatedAt time.Time `json:"created_at"`
}
```

#### 核心邏輯

| 功能 | 說明 |
|------|------|
| **Streak 計算** | 連續達成天數，中斷則歸零 |
| **Freeze 卡** | (可選) 允許一定次數的「暫停」不中斷連續 |
| **完成率** | 本週/本月的達成百分比 |

#### 視覺化

- **熱力圖 (Heatmap)**：類似 GitHub Contribution Graph
- **Streak Badge**：🔥 連勝天數徽章
- **完成動畫**：Checkmark 打勾動效

---

### B. Todo Board（任務看板）

**目標**：管理單次性任務與專案

#### 看板欄位 (Kanban Columns)

| 欄位 | 用途 | 特色 |
|------|------|------|
| **Backlog** | 點子池 | 未排程的想法 |
| **This Week** | 本週目標 | 週初規劃 |
| **Today** | 今日戰場 | **核心聚焦區** |
| **Done** | 完成 | 本週已完成 |

#### 資料模型

```go
type Task struct {
    ID          string    `gorm:"primaryKey" json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Column      string    `json:"column"`         // backlog / this_week / today / done
    Priority    int       `json:"priority"`       // 1-3 (高/中/低)
    DueDate     *string   `json:"due_date"`       // 可選截止日
    Tags        string    `json:"tags"`           // 逗號分隔標籤
    Order       int       `json:"order"`          // 欄內排序
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

#### 互動設計

- **拖拉 (Drag & Drop)**：任務卡片在欄位間移動
- **快速新增**：每個欄位底部有 Quick Add 輸入框
- **完成動畫**：Confetti 🎉 或淡出效果

---

### C. War Room（戰情室）

**目標**：一目了然的人生儀表板

#### 整合顯示

| 區塊 | 資料來源 | 顯示內容 |
|------|----------|----------|
| **Kite 摘要** | Kite 模組 | 今日損益、目前風向、門燈狀態 |
| **習慣進度** | Habit Tracker | 今日習慣達成率、連勝紀錄 |
| **任務聚焦** | Todo Board | Today 欄剩餘數、優先任務 |
| **快速行動** | - | 常用功能快捷按鈕 |

#### UI 佈局

```
┌─────────────────────────────────────┐
│           War Room 戰情室            │
├──────────────┬──────────────────────┤
│   🪁 Kite    │    🧠 LifeOS         │
│  ─────────   │   ─────────────      │
│  今日損益    │   習慣: 3/5 ✓        │
│  +2,500      │   任務: 2 待完成     │
│  🟢 GREEN    │   🔥 連勝 7 天       │
├──────────────┴──────────────────────┤
│         ⚡ 快速行動                  │
│  [記錄風型] [新增任務] [記錄習慣]    │
└─────────────────────────────────────┘
```

---

## 3. API 端點規劃

### Habit Tracker
```
GET    /api/lifeos/habits              # 習慣列表
POST   /api/lifeos/habits              # 新增習慣
PUT    /api/lifeos/habits/:id          # 更新習慣
DELETE /api/lifeos/habits/:id          # 刪除習慣
GET    /api/lifeos/habits/:id/logs     # 習慣記錄
POST   /api/lifeos/habits/:id/check    # 打卡
```

### Todo Board
```
GET    /api/lifeos/tasks               # 任務列表
POST   /api/lifeos/tasks               # 新增任務
PUT    /api/lifeos/tasks/:id           # 更新任務
DELETE /api/lifeos/tasks/:id           # 刪除任務
PATCH  /api/lifeos/tasks/:id/move      # 移動欄位
```

### War Room
```
# 無後端聚合 API — War Room 採用前端 client-side 聚合
# 直接呼叫 Kite + LifeOS 現有 API，保持模組隔離
```

---

## 4. UI 設計重點

### 字體策略

| 元素 | 字體 | 效果 |
|------|------|------|
| 標題/數字 | **Caveat** | 手寫感、溫暖 |
| 內文/按鈕 | **Quicksand** | 圓潤、友善 |

### 風格區隔

| 模組 | 風格關鍵字 | 配色傾向 |
|------|------------|----------|
| **Kite** | 硬派、財經、專業 | 深色、對比強烈 |
| **LifeOS** | 溫暖、手帳、個人 | 柔和、Soft UI |

### 建議設計風格

參考 UI UX Pro Max 的：
- **Soft UI / Neumorphism**：柔和凹凸感
- **Claymorphism**：3D 軟質感
- 與 Kite 的 Dark Mode 高對比做出區隔

### 互動動畫

| 事件 | 動畫 |
|------|------|
| 完成習慣 | ✓ Checkmark 彈出 + 連勝火焰 🔥 |
| 完成任務 | Confetti 🎉 或 Strike-through 動畫 |
| 拖拉任務 | 卡片浮起陰影 + 平滑移動 |

---

## 5. 開發路線 (Roadmap)

### Phase 1：後端基礎 ✅
- [x] 建立 `internal/modules/lifeos/` 資料夾結構
- [x] 建立 `Habit` 與 `HabitLog` Model
- [x] 建立 `Task` Model
- [x] 實作 CRUD API

### Phase 2：前端基礎 ✅
- [x] 建立 `src/apps/lifeos/` 路由與 Layout
- [x] 實作 Habit Tracker 頁面（CRUD + 打卡 + Streak Badge）
- [x] 實作 Todo Board 頁面（CRUD + Quick Add + Drag & Drop）

### Phase 3：整合 ✅
- [x] 實作 War Room Dashboard（跨模組 Kite + LifeOS 整合）
- [x] 前端 client-side 資料聚合（保持模組隔離，不新增後端聚合 API）
- [x] Overview Stats 統計卡片
- [x] Habit Heatmap 熱力圖

### Phase 4：優化（進行中）
- [x] 熱力圖視覺化（GitHub 風格 16 週 Heatmap）
- [ ] 完成動畫（Confetti / Checkmark）
- [ ] 通知 / 提醒系統
- [ ] 統計報表
- [ ] F.L.O.W. 分類標籤
- [ ] Freeze 卡（暫停不中斷 streak）

---

## 6. 與其他模組的關係

```
┌──────────────────────────────────────┐
│              War Room                │
│         (跨模組整合面板)              │
├─────────────┬────────────────────────┤
│   讀取      │        讀取            │
│     ↓       │          ↓             │
│  🪁 Kite    │     🧠 LifeOS          │
│  (獨立)     │      (獨立)            │
└─────────────┴────────────────────────┘
```

**原則**：
- 模組之間不直接 import
- War Room 透過 API 聚合資料
- 共用元件放 `/src/components/`

---

*最後更新：2026-02-08*
