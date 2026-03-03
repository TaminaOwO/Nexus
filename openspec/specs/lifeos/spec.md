# LifeOS 生活管理模組規格

> **模組路由**：`/admin` (或 `/lifeos`)
> **資料表前綴**：`lifeos_`
> **狀態**：✅ MVP 完成 (2026-02-08) ｜ 通知系統 ✅ (2026-02-10) ｜ Skincare ✅ (2026-02-11)
> **最後更新**：2026-02-24
> **來源**：`design-system/nexus/pages/LIFEOS_SPECS.md`

---

## Requirements

### Requirement: Habit Tracker 習慣追蹤

系統 MUST 提供習慣追蹤功能，使用者 SHALL 能夠定義習慣、每日打卡，並查看連勝統計與熱力圖。

**資料模型**：

```go
type Habit struct {
    ID           string    `gorm:"primaryKey" json:"id"`
    Name         string    `json:"name"`
    Frequency    string    `json:"frequency"`      // Daily / Weekly
    TargetStreak int       `json:"target_streak"`
    FreezeCards  int       `json:"freeze_cards"`   // 凍結卡數量
    Icon         string    `json:"icon"`
    Color        string    `json:"color"`
    CreatedAt    time.Time `json:"created_at"`
}

type HabitLog struct {
    ID        string    `gorm:"primaryKey" json:"id"`
    HabitID   string    `json:"habit_id"`
    Date      string    `json:"date"`     // YYYY-MM-DD
    Status    string    `json:"status"`   // Done / Skipped / Missed / Frozen
    CreatedAt time.Time `json:"created_at"`
}
```

#### Scenario: 每日打卡

- WHEN 使用者點擊習慣的打卡按鈕
- THEN 系統 MUST 建立一筆 `HabitLog` 記錄（Status = Done）
- AND 系統 SHALL 重新計算連勝天數（Streak）
- AND 介面 MUST 播放打卡完成的 Pop 動畫

#### Scenario: 使用凍結卡

- WHEN 使用者點擊凍結卡按鈕
- THEN 系統 MUST 檢查該習慣是否有剩餘凍結卡
- AND 若有剩餘，系統 SHALL 將 `FreezeCards` 數量 -1，並建立 Status = `Frozen` 的 HabitLog
- AND `Frozen` 狀態 MUST 計入 Streak 計算，不中斷連勝天數

#### Scenario: 查看 Heatmap

- WHEN 使用者檢視習慣詳情
- THEN 系統 MUST 顯示 GitHub 風格的 16 週 Heatmap
- AND 完成率 SHALL 依照本週/本月計算百分比

---

### Requirement: Todo Board 任務看板

系統 MUST 提供 Kanban 看板式任務管理，支援 F.L.O.W. 能量分類系統。

**看板欄位**：

| 欄位 | 用途 |
|------|------|
| Backlog | 未排程的點子池 |
| This Week | 本週目標 |
| Today | 今日戰場（核心聚焦區） |
| Done | 本週已完成 |

**F.L.O.W. 分類系統**：

| 代碼 | 名稱 | 定義 | 顏色 |
|------|------|------|------|
| F | Focus / Funnel | 定義規則、規劃 SOP | `#6366F1` 紫 |
| L | Leverage | 建立可重複使用的資產 | `#F59E0B` 金 |
| O | Operate / Optimize | 維持系統運作的必要勞動 | `#10B981` 綠 |
| W | Wealth / Waste | 變現行動 / 低價值可消除 | `#EF4444` 紅 |

**資料模型**：

```go
type Task struct {
    ID          string    `gorm:"primaryKey" json:"id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Column      string    `json:"column"`      // backlog / this_week / today / done
    Priority    int       `json:"priority"`    // 1-3 (高/中/低)
    DueDate     *string   `json:"due_date"`
    Tags        string    `json:"tags"`
    FlowType    string    `json:"flow_type"`   // F / L / O / W
    Order       int       `json:"order"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

#### Scenario: 拖拉任務至新欄位

- WHEN 使用者將任務卡片拖拉到另一個看板欄位
- THEN 系統 MUST 更新該任務的 `Column` 與 `Order`
- AND 系統 SHALL 透過 `PATCH /api/lifeos/tasks/:id/move` 持久化

#### Scenario: 快速新增任務

- WHEN 使用者在看板欄位底部的 Quick Add 輸入框輸入標題並送出
- THEN 系統 MUST 在該欄位建立新任務
- AND 新任務 SHALL 預設 Priority = MEDIUM

#### Scenario: FlowStats 統計

- WHEN 使用者查看 Overview 頁面
- THEN 系統 MUST 顯示本週 F.L.O.W. 分佈橫條圖
- AND 系統 SHALL 顯示最近 4 週的 F.L.O.W. 趨勢

---

### Requirement: War Room 戰情室

系統 MUST 提供跨模組整合面板，一目了然顯示 Kite + LifeOS 的關鍵指標。

**整合區塊**：

| 區塊 | 資料來源 | 顯示內容 |
|------|----------|----------|
| Kite 摘要 | Kite 模組 API | 今日損益、目前風向、門燈狀態 |
| 習慣進度 | Habit Tracker API | 今日習慣達成率、連勝紀錄 |
| 任務聚焦 | Todo Board API | Today 欄剩餘數、優先任務 |
| 快速行動 | — | 常用功能快捷按鈕 |

**模組隔離原則**：War Room MUST 透過前端 client-side 聚合各模組 API，MUST NOT 新增後端聚合 API。

#### Scenario: 戰情室載入

- WHEN 使用者進入 War Room 頁面
- THEN 系統 MUST 同時呼叫 Kite + LifeOS 各 API 取得資料
- AND 系統 SHALL 在前端聚合並顯示摘要卡片
- AND 模組之間 MUST NOT 有後端直接 import 依賴

---

### Requirement: Discord 通知提醒系統

系統 MUST 支援 Discord Webhook 通知，使用者 SHALL 能夠自訂提醒類型與時間。

**通知類型**：

| 類型 | 預設時間 | 觸發條件 | Embed 顏色 |
|------|----------|----------|------------|
| `HABIT_DAILY` | 21:00 | 今日有未完成的習慣 | Coral (#CC7A60) |
| `TASK_DUE_SOON` | 09:00 | 任務將於 N 天內到期 | Orange |
| `TASK_OVERDUE` | 09:00 | 有逾期未完成的任務 | Red |
| `SKINCARE_AM` | 08:00 | 每日早晨推送 AM 保養步驟 | Coral |
| `SKINCARE_PM` | 18:00 | 每日晚間推送 PM 保養步驟 | Coral |

**去重機制**：per calendar day，透過 `LifeOSNotificationLog.ref_date` 實現。

**共用基礎設施**：`pkg/discord/discord.go`（Kite + LifeOS 共用），LifeOS 使用 `DISCORD_LIFEOS_WEBHOOK_URL` env var。

#### Scenario: 習慣打卡提醒

- WHEN 掃描時間到達設定的 `HABIT_DAILY` 提醒時間
- AND 今日有未完成的習慣
- THEN 系統 MUST 發送 Discord 通知列出未完成項目
- AND 同一天 MUST NOT 重複發送

#### Scenario: 測試通知

- WHEN 使用者在前端點擊測試通知按鈕
- THEN 系統 MUST 發送一筆測試通知（跳過 dedup）
- AND 通知 SHALL 透過 `POST /api/lifeos/reminders/test` 觸發

---

### Requirement: Skincare Strategy 保養策略引擎

系統 MUST 根據生理週期自動產生每日 AM/PM 保養建議，並內建嚴格的產品衝突守門員規則。

**週期階段**：`menstrual` / `follicular` / `ovulation` / `luteal` / `waiting`

**全域守門員規則**：

| 規則 | 限制 |
|------|------|
| A醇 (A 類) | Follicular 最多 2 晚/週，Luteal 最多 1 晚/週，Menstrual 禁用 |
| 酸類 (Stridex) | 僅限 Ovulation + Early Luteal，PM only，T-Zone only |
| 儀器 (Booster Pro) | 不可與 A醇 同晚使用，禁用 Full Face Induction |
| 眼霜 | `BOJ A醛` 最多 2 晚/週，不可與 A醇 同晚 |

**排程規則 Model**：

```go
type SkincareScheduleRule struct {
    ProductKey string // retinol / boj_eye
    Phase      string // follicular / luteal
    Weekdays   string // "Tuesday,Friday"
    MaxPerWeek int    // 上限次數
}
```

#### Scenario: 取得今日保養建議

- WHEN 使用者查看今日保養頁面
- THEN 系統 MUST 根據當前週期階段回傳 AM/PM 保養步驟
- AND 系統 SHALL 套用所有守門員規則（A醇 / 酸類 / 儀器衝突檢測）

#### Scenario: 經期延遲處理

- WHEN 週期天數超過預設週期長度
- THEN 系統 MUST 進入 `waiting`（等候期）階段
- AND 前端 SHALL 顯示「確認經期開始」按鈕供手動重設

#### Scenario: 自訂排程規則

- WHEN 使用者在排程設定 Modal 調整產品使用日
- THEN 系統 MUST 即時檢測 A醇 ↔ BOJ A醛 同日衝突
- AND 系統 SHALL 透過 `PUT /api/lifeos/skincare/schedule` 儲存

---

### Requirement: LifeOS API 端點

系統 MUST 提供以下 RESTful API 端點：

**Habit Tracker**：
```
GET    /api/lifeos/habits              # 習慣列表
POST   /api/lifeos/habits              # 新增習慣
PUT    /api/lifeos/habits/:id          # 更新習慣
DELETE /api/lifeos/habits/:id          # 刪除習慣
GET    /api/lifeos/habits/:id/logs     # 習慣記錄
POST   /api/lifeos/habits/:id/check    # 打卡
POST   /api/lifeos/habits/:id/freeze   # 使用凍結卡
```

**Todo Board**：
```
GET    /api/lifeos/tasks               # 任務列表
POST   /api/lifeos/tasks               # 新增任務
PUT    /api/lifeos/tasks/:id           # 更新任務
DELETE /api/lifeos/tasks/:id           # 刪除任務
PATCH  /api/lifeos/tasks/:id/move      # 移動欄位
```

**Reminder**：
```
GET    /api/lifeos/reminders            # 提醒設定列表
PUT    /api/lifeos/reminders/:type      # 更新提醒設定
POST   /api/lifeos/reminders/test       # 發送測試通知
```

**Skincare**：
```
GET    /api/lifeos/skincare/today        # 今日保養建議
GET    /api/lifeos/skincare/week         # 本週保養排程
GET    /api/lifeos/skincare/cycle        # 取得週期設定
PUT    /api/lifeos/skincare/cycle        # 設定/更新週期
GET    /api/lifeos/skincare/schedule     # 取得排程規則
PUT    /api/lifeos/skincare/schedule     # 批次更新排程
POST   /api/lifeos/skincare/test-notify  # 發送測試通知
```

#### Scenario: 任務 CRUD

- WHEN 使用者透過前端建立新任務
- THEN 系統 MUST 透過 `POST /api/lifeos/tasks` 持久化
- AND 回傳的任務 SHALL 包含自動生成的 UUID

---

### Requirement: LifeOS UI 設計規範

LifeOS 模組的 UI MUST 與 Kite 模組做出明確風格區隔。

| 模組 | 風格 | 配色 |
|------|------|------|
| Kite | 溫暖、柔和、與 LifeOS 風格統一 | 與 LifeOS 相近 |
| LifeOS | 溫暖、手帳、個人 | 柔和 Soft UI |

**字體策略**：
- 標題/數字：**Caveat**（手寫感、溫暖）
- 內文/按鈕：**Quicksand**（圓潤、友善）

**互動動畫**：
- 完成習慣：✓ Checkmark 彈出 + 連勝火焰
- 完成任務：Confetti 或 Strike-through 動畫
- 拖拉任務：卡片浮起陰影 + 平滑移動

#### Scenario: LifeOS 風格識別

- WHEN 使用者從 Kite 切換至 LifeOS
#### Scenario: LifeOS 風格識別

- WHEN 使用者從 Kite 切換至 LifeOS
- THEN 介面 MUST 載入 Soft UI 風格（柔和色調與圓潤元素）
- AND 字體 MUST 切換為 Caveat (標題) + Quicksand (內文)

#### Scenario: Mobile First 響應式佈局

- WHEN 使用者在行動裝置上使用 LifeOS
- THEN 介面 MUST 使用 Mobile First 設計原則
- AND 所有可互動元素 MUST 滿足 44x44px 最小觸控目標
- AND 輸入欄位 font-size MUST 不小於 16px（防止 iOS 自動縮放）
- AND 佈局 SHALL 在 640px 斷點切換為單欄模式
- AND 佈局 SHALL 在 380px 斷點進一步精簡間距與字型大小

#### Scenario: Kanban 看板行動裝置體驗

- WHEN 使用者在手機上使用 Todo Board
- THEN 看板 MUST 支援水平滑動切換欄位
- AND 拖拉操作 MUST 支援觸控手勢
- AND 內容 MUST NOT 產生水平溢出（overflow-x 防護）

#### Scenario: Habit Heatmap 行動裝置體驗

- WHEN 使用者在手機上查看 Heatmap
- THEN 熱力圖 MUST 在小螢幕上可水平捲動
- AND 格子大小 SHALL 維持可辨識的最小尺寸

