# CLAUDE.md - Nexus 專案指南

> 這是給 AI 助手（如 Claude）理解本專案的完整指南  
> 目標：**共同拆解問題、驗證推論、將模糊想法轉為可執行結構**

---

## 📋 目錄
1. [與 Tamina 的協作原則](#與-tamina-的協作原則)
2. [Nexus Master Plan](#nexus-master-plan)
3. [模組化單體架構](#模組化單體架構)
4. [Kite 模組詳解](#kite-模組詳解)
5. [技術棧](#技術棧)
6. [程式碼風格指南](#程式碼風格指南)
7. [API 慣例](#api-慣例)
8. [CSS 設計系統](#css-設計系統)
9. [部署策略 (Railway + Docker)](#部署策略)
10. [未來 RBAC 權限規劃](#未來-rbac-權限規劃)

---

## 與 Tamina 的協作原則

### 溝通基本規範
- **語氣**：專業、直接、冷靜
- **禁止**：過度共感、心靈雞湯、安慰式收尾
- **回應順序**：先給結論 → 再給推論拆解

### 思考與回應模式
任何結論需回答：
1. 判斷依據是什麼
2. 適用條件是什麼
3. 何種情況下會失效

> 同意需說明理由，不同意需指出邏輯斷點  
> **不可為了迎合而順著說**

### 專業背景（視為前置知識）
- **工程**：後端工程師 (C# / Go)，熟悉系統設計、抽象層
- **投資術語已定義**：結構風度（週級）、操作風度（日級）、Gate 判斷表、上班族型/老闆型策略
- **高度敏感**：「是否能落地」

### 地雷區（踩到即視為回應失效）
- 叫錯名字或身份
- 過度擬人化（特別是貓）
- 使用無法驗證的泛稱：「大家都覺得」、「通常來說」
- 策略問題只談理念，不給判斷門檻與失效條件

### 校準指令
當 AI 偏離時，可能直接下達：
- 「不要順著我，重新驗證」
- 「結論先給」
- 「給我判斷門檻，不要講概念」

**AI 應立即調整，不辯解。**

---

## Nexus Master Plan

### 願景
Nexus 是一個**個人生產力中樞**，整合三大核心模組：

| 模組 | 用途 | 狀態 | 路由 |
|------|------|------|------|
| **🪁 Kite** | 台股交易決策系統 | ✅ 完成 | `/kite` |
| **🧠 LifeOS** | 生活管理（習慣/任務） | 🚧 MVP | `/admin` |
| **💪 ChoiceFit** | 健身教練平台（學員端） | 📝 規劃中 | `/choice-fit` |

### 為什麼是「模組化單體」而非微服務？

**戰術考量**：HYROX 時間緊迫，單一部署最快  
**戰略預留**：Docker + Railway 已具備拆分空間

```
現在：Server (Go) → 單一入口，但模組獨立資料夾
未來：同一 Repo 可部署出多個服務（透過環境變數控制功能）
```

---

## 模組化單體架構

### 專案結構
```
Nexus/
├── cmd/server/            # Go 主程式進入點
├── internal/
│   ├── database/          # SQLite + GORM 設定
│   └── modules/
│       ├── kite/          # 🪁 Kite 後端
│       │   ├── handler/   # HTTP 處理器
│       │   ├── model/     # 資料模型
│       │   └── service/   # 商業邏輯
│       ├── lifeos/        # 🧠 LifeOS 後端
│       └── choicefit/     # 💪 ChoiceFit 後端
├── src/
│   ├── apps/
│   │   ├── kite/          # 🪁 Kite 前端
│   │   ├── lifeos/        # 🧠 LifeOS 前端
│   │   └── choicefit/     # 💪 ChoiceFit 前端
│   └── components/        # 共用元件
├── Dockerfile             # 多階段建置
├── railway.toml           # Railway 部署設定
└── nexus.db               # SQLite 資料庫
```

### 新增模組的標準步驟
1. 後端：新增 `internal/modules/{module}/` 資料夾
2. 前端：新增 `src/apps/{module}/` 資料夾
3. 路由：在 `cmd/server/main.go` 註冊 API
4. 前端路由：在 `App.tsx` 加入 lazy loading

---

## Kite 模組詳解

### 核心概念：風、結構、門

#### 🌬️ Wind（風）- 當日市場狀態
```typescript
type WindType = "STRONG" | "TURBULENT" | "GUSTY" | "CALM";
// 🦅 強風 = 大盤強勁  |  🌪️ 亂流 = 波動劇烈
// 🍃 陣風 = 小幅波動  |  🐢 無風 = 冷清/下跌
```

#### 📊 Structure（結構）- 市場週期
```typescript
type StructureType = "EASY_RISE" | "EASY_FALL" | "BOUNDARY";
// 計算：最近 5 天風型分布
// 易漲 = 多數 STRONG/TURBULENT  |  易跌 = 多數 GUSTY/CALM
```

#### 🚦 Gate Light（門燈）- 進場信號
| 燈號 | 條件 | 意義 |
|------|------|------|
| 🟢 GREEN | EASY_RISE + STRONG | 可大膽進場 |
| 🟡 YELLOW | 混合信號 / BOUNDARY | 謹慎觀望 |
| 🔴 RED | EASY_FALL 或 CALM | 禁止進場 |

#### 📈 Strategy（策略）
| 策略 | 觸發條件 | 風格 |
|------|----------|------|
| **OFFICE 🏢** | Structure = EASY_RISE | 追漲動能股 |
| **BOSS 🛡️** | Structure ≠ EASY_RISE | 逢低佈局價值股 |

**子策略**：
- OFFICE：`STRONG_WEEKLY`（追漲）、`WEEKLY_TREND`（買拉回）
- BOSS：`WEEKLY_PULLBACK`（週拉回）、`CHEAP_ACQUISITION`（廉價收購）

### 元件清單
| 元件 | 功能 |
|------|------|
| `WindCockpit` | 風型記錄 + 結構顯示 + 門燈 |
| `StockInspector` | 個股分析 + K線圖 + 策略診斷 |
| `StockChart` | K線圖表 (日/週/月) |
| `Watchlist` | 觀察清單管理 |
| `TradeJournal` | 進行中交易 |
| `TradeHistory` | 歷史績效 |

---

## 技術棧

### 後端
| 技術 | 用途 |
|------|------|
| **Go** | 後端語言 |
| **Gin** | HTTP 框架 |
| **GORM** | ORM (SQLite) |
| **UUID** | ID 生成 |

### 前端
| 技術 | 用途 |
|------|------|
| **React 18** | UI 框架 |
| **TypeScript** | 類型安全 |
| **Vite** | 開發打包 |
| **Tailwind CSS / Vanilla CSS** | 樣式（可混用） |

### 資料庫
- **SQLite** (`nexus.db`)
- GORM AutoMigrate

### 外部整合
- **Fugle API**：台股 K 線資料（有日期範圍限制）
- **TWSE API**：即時報價

---

## 程式碼風格指南

### Go 後端
```go
// Handler 命名：動詞 + 名詞
func GetWatchlist(c *gin.Context) { }
func CreateWatchlistEntry(c *gin.Context) { }

// Model 使用 GORM tags + JSON tags
type WatchlistEntry struct {
    ID          string    `gorm:"primaryKey" json:"id"`
    Symbol      string    `json:"symbol"`
    CreatedAt   time.Time `json:"created_at"`
}
```

### TypeScript 前端
```typescript
// 類型集中定義在 types.ts
import { WindType, GateLight } from "./types";

// 元件使用 function 宣告
function StockInspector({ gateLight }: Props) { }

// Hooks 以 use 開頭
function useWindHistory() { }
```

### CSS 規則
- 可用 **Tailwind** 或 **Vanilla CSS**（或混用）
- 現有 CSS 變數定義在 `kite.css :root`
- **Mobile First**：先寫手機版，再用 media query 覆寫
- 每個元件有獨立 CSS 檔案

---

## API 慣例

### RESTful 端點格式
```
GET    /api/{module}/{resource}     → 列表
GET    /api/{module}/{resource}/:id → 單筆
POST   /api/{module}/{resource}     → 新增
PUT    /api/{module}/{resource}/:id → 更新
DELETE /api/{module}/{resource}/:id → 刪除
```

### Kite 端點
```
/api/kite/quote/:symbol     # 即時報價
/api/kite/chart/:symbol     # K線資料
/api/kite/watchlist         # 觀察清單 CRUD
/api/kite/journal           # 交易記錄
/api/kite/portfolio         # 持倉
/api/kite/history           # 歷史績效
/api/kite/wind              # 風型記錄
```

---

## CSS 設計系統

### 核心變數（kite.css :root）
```css
/* 策略色彩 */
--office-primary: #6366f1;  /* 紫色系 */
--boss-primary: #f59e0b;    /* 金色系 */

/* 語意顏色 */
--success: #10b981;  /* 綠 - 漲 */
--danger: #ef4444;   /* 紅 - 跌 */

/* 字型 */
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* 圓角 */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
```

### 共用 Class
```css
.glass-card / .glass-card.office / .glass-card.boss
.modern-input
.btn-primary / .btn-secondary / .btn-danger
.price-display.up / .price-display.down
.strategy-badge.office / .strategy-badge.boss
```

---

## 部署策略

### Railway + Docker

**目前設定**：
- `Dockerfile`：多階段建置 (npm build → go build)
- `railway.toml`：健康檢查 `/api/kite/ping`

### 本地開發
```bash
# 終端機 1 - 前端
npm run dev

# 終端機 2 - 後端
go run ./cmd/server
```

### 部署流程
```
GitHub Push → Railway 自動建置 → Docker Image → 部署
```

### 未來拆分路徑
若需物理隔離（例如學員不能看股票）：
```
專案 A (Nexus Prime)：Kite + LifeOS → 資料庫 A → 只有 Tamina
專案 B (ChoiceFit)：ChoiceFit → 資料庫 B → 學員登入
```
透過**環境變數**控制「這個站台開啟哪些功能」。

---

## 未來 RBAC 權限規劃

### 階段 1（現在）
- 權限：無驗證
- 使用者：只有 Tamina (Super Admin)
- 目標：個人使用，極速開發

### 階段 2（新增使用者時）
1. 資料庫新增 `Users` 表格：`ID, Role, Password`
2. Role：`ADMIN`（Tamina）、`STUDENT`、`TA`
3. Go 後端加入 **Middleware 守門員**：

```go
// 偽代碼
func AuthMiddleware(allowedRoles []string) gin.HandlerFunc {
    return func(c *gin.Context) {
        user := getCurrentUser(c)
        if !contains(allowedRoles, user.Role) {
            c.JSON(403, gin.H{"error": "Forbidden"})
            c.Abort()
            return
        }
        c.Next()
    }
}

// 使用
kiteRoutes.Use(AuthMiddleware([]string{"ADMIN"}))
choicefitRoutes.Use(AuthMiddleware([]string{"ADMIN", "STUDENT", "TA"}))
```

**結論**：現有程式碼不需重寫，未來只需「加上」守門員。

---

## ⚠️ 注意事項

1. **CSS 系統** - 現有 CSS 變數系統可與 Tailwind 共存
2. **Mobile First** - CSS 先寫手機版
3. **繁體中文 UI** - 介面以中文為主
4. **Fugle API 限制** - K線需分批取資料
5. **策略邏輯在前端** - `src/apps/kite/utils/`

---

## 🔧 常見任務

| 任務 | 步驟 |
|------|------|
| **新增 Watchlist 欄位** | 1. 更新 `model/watchlist.go` 2. 更新 Request struct 3. 更新 `Watchlist.tsx` |
| **新增圖表時間框架** | 1. 修改 `chart_handler.go` 2. 修改 `StockChart.tsx` |
| **調整策略判斷邏輯** | 修改 `utils/calculateStructure.ts` 和 `utils/getGateLight.ts` |
| **新增模組** | 1. 建 `internal/modules/{name}/` 2. 建 `src/apps/{name}/` 3. 註冊路由 |

---

*最後更新：2026-01-22*
