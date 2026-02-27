# CLAUDE.md - Nexus 全域開發指南

> **專案身分**：Nexus 個人生產力中樞 (Modular Monolith)
> **核心目標**：極速開發、實用主義、落地執行
> **協作對象**：Tamina (Engineer / Wife / Mom)

---

## 1. 核心協作原則 (Strict Protocols)

### 溝通基本規範
- **語氣**：專業、直接、冷靜。禁止過度共感或心靈雞湯。
- **邏輯優先**：任何結論需回答「判斷依據」、「適用條件」、「失效門檻」。
- **回應順序**：先給結論 → 再給推論拆解

### 地雷區（踩到即視為回應失效）
- 叫錯名字 (我是 Tamina)
- 過度擬人化 (貓就是貓)
- 使用無法驗證的泛稱：「大家都覺得」、「通常來說」
- 策略問題只談理念，不給判斷門檻與失效條件
- 為了迎合而順著說 (若有邏輯斷點請直接反駁)

### 校準指令
當我說以下指令時，請**立即切換模式，不辯解**：
- 「不要順著我」→ 重新驗證推論
- 「結論先給」→ 直接給答案
- 「給我判斷門檻，不要講概念」→ 產出可執行條件

---

## 2. 系統架構與技術棧

請參見 [`docs/PRODUCT.md`](file:///d:/Code/project/Nexus/docs/PRODUCT.md) 以取得系統架構、目錄結構、模組列表與技術棧資訊。
| **TypeScript** | 類型安全 |
| **Vite** | 開發打包 |
| **Vanilla CSS** | 樣式（可混用 Tailwind） |

### 資料庫
- **SQLite** (`nexus.db`)
- GORM AutoMigrate（持久化優先）

### 外部整合
- **Fugle API**：台股 K 線資料（注意日期範圍限制）
- **TWSE API**：即時報價
- **Discord Webhook**：即時警報通知系統（停損/停利/策略規則）

---

## 4. UI/UX 設計系統規範

**本專案已整合 UI UX Pro Max Skill。**

當進行介面設計時，請依序讀取以下資源：

1. **核心知識庫**：`./.claude/skills/ui-ux-pro-max` (含規則與 Anti-patterns)
2. **專案覆蓋檔**：`openspec/specs/` 下的規格定義

### Nexus 視覺關鍵字 (from MASTER.md)

| 屬性 | 設定 |
|------|------|
| **風格** | Dark Mode (OLED), High Contrast |
| **標題字體** | Caveat (手寫感) |
| **內文字體** | Quicksand (圓潤感) |
| **Primary** | `#3B82F6` (Trust Blue) |
| **CTA** | `#F97316` (Orange) |

### CSS 核心變數 (kite.css :root)
```css
/* 策略色彩 */
--office-primary: #6366f1;  /* 紫色系 - OFFICE 策略 */
--boss-primary: #f59e0b;    /* 金色系 - BOSS 策略 */

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

### 共用 CSS Class
```css
.glass-card / .glass-card.office / .glass-card.boss
.modern-input
.btn-primary / .btn-secondary / .btn-danger
.price-display.up / .price-display.down
.strategy-badge.office / .strategy-badge.boss
```

---

## 5. API 與程式碼慣例

### Go 後端
```go
// Handler 命名：動詞 + 名詞
func GetWatchlist(c *gin.Context) { }
func CreateWatchlistEntry(c *gin.Context) { }

// Model 使用 GORM tags + JSON tags
type WatchlistEntry struct {
    ID        string    `gorm:"primaryKey" json:"id"`
    Symbol    string    `json:"symbol"`
    CreatedAt time.Time `json:"created_at"`
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

### RESTful API 端點格式
```
GET    /api/{module}/{resource}     → 列表
GET    /api/{module}/{resource}/:id → 單筆
POST   /api/{module}/{resource}     → 新增
PUT    /api/{module}/{resource}/:id → 更新
DELETE /api/{module}/{resource}/:id → 刪除
```

### CSS 規則
- **Mobile First**：先寫手機版，再用 media query 覆寫
- 現有 CSS 變數定義在 `kite.css :root`
- 每個元件有獨立 CSS 檔案

---

## 6. 啟動與部署

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

### Railway 設定
- `Dockerfile`：多階段建置 (npm build → go build)
- `railway.toml`：健康檢查 `/api/kite/ping`

---

## 7. 模組專屬規格

當開發特定模組時，請一併參考對應規格書：

| 模組 | 規格書位置 | 必讀標記 |
|------|------------|----------|
| 🪁 Kite | `openspec/specs/kite/spec.md` | 風控邏輯、策略系統、交易術語 |
| 🧠 LifeOS | `openspec/specs/lifeos/spec.md` | 習慣追蹤、看板邏輯、War Room |

### 快速啟動 Prompt 範例
```
「Tamina 呼叫。請讀取 CLAUDE.md。
今天要優化 Kite 的 MACD 計算，請參考 openspec/specs/kite/spec.md。」
```

---

## 8. 開發守則提醒

1. **Discipline > Analysis**：優先實作「守門員邏輯」（阻擋壞交易）而非「視覺分析」（花俏圖表）
2. **模組隔離**：模組之間不得互相 import，只能共用 `/pkg`（Go）或 `/src/shared`（React）
3. **Mobile First**：交易時間用手機看，版面必須響應式
4. **持久化優先**：新 Entity 必須加入 `AutoMigrate`，存入 `/app/data/nexus.db`
5. **繁體中文 UI**：介面以中文為主
6. **文件同步**：每次重大功能完成後，更新以下文件：
   - `CLAUDE.md`（全域指南）
   - `docs/PRODUCT.md`（產品與架構文件）
   - `docs/TODO.md`（開發路線圖）
   - `openspec/specs/` 內的相關規格
7. **文件同步與 TODO 閉環**：每次功能實作 (`/openspec-apply`) 完成後，必須：
   - 立即更新 `docs/TODO.md`：將對應的開發項目從 `[ ]` 改為 `[x]`。
   - 同步更新 `docs/PRODUCT.md` 與 `openspec/specs/` 相關規格。

---

*最後更新：2026-02-27*
