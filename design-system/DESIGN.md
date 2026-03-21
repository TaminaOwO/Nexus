# Nexus Dashboard v0.2 — Design System

> **版本：** 2.0.0
> **產出日期：** 2026-03-20
> **產出者：** Architect-Office（Design Consultation）
> **美學方向：** Terminal/CLI 有機感 + Morandi 色系 + skillsmp.com 參考

---

## 1. 美學宣言

**Nexus 是一座安靜的指揮室，不是一個吵鬧的儀表板。**
每一個像素服務於決策，不服務於裝飾。Morandi 的灰調克制讓長時間注視成為可能，Terminal 的視覺文法讓資訊結構一目瞭然。這裡沒有歡迎語、沒有動畫煙火——只有你需要的數據，在你需要的位置。

---

## 2. 字型系統

### 選型理由

| 層級 | 字型 | 理由 |
|---|---|---|
| Display | **Cagliostro** | 標題、英雄數字、部門名稱。帶有手寫質感的襯線字型，為 Terminal 美學注入有機溫度 |
| Heading | **IBM Plex Sans** | 所有 H1-H4、卡片標題、導航。Industrial 基因，x-height 高、數字辨識度強 |
| Body | **IBM Plex Sans** | 正文、說明、標籤。與 Heading 統一，減少字型數量 |
| Mono | **mononoki** | 數值、代碼、terminal 風格元素、時間戳記。開源等寬字型，字形辨識度高，適合 CLI 美學 |

> **來源與載入：**
>
> display:  Cagliostro — 標題、英雄數字、部門名稱
>           來源：https://fonts.google.com/specimen/Cagliostro
>           載入：`<link href="https://fonts.googleapis.com/css2?family=Cagliostro&display=swap" rel="stylesheet">`
>
> heading/body: IBM Plex Sans
>               來源：https://fonts.google.com/specimen/IBM+Plex+Sans
>               載入：`<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">`
>
> mono: mononoki
>       來源：https://madmalik.github.io/mononoki/（非 Google Fonts，需自行下載或使用 CDN）
>       備選：IBM Plex Mono（Google Fonts 可直接載入，風格相近）

### 字型比例尺（px）

```
typography:
  scale:
    xs:      11px  | line-height: 1.4  — 輔助標籤、時間戳記、版本號
    sm:      13px  | line-height: 1.5  — 次要資訊、表格內容、metadata
    base:    15px  | line-height: 1.6  — Body 文字、卡片內容、主要閱讀
    lg:      18px  | line-height: 1.5  — 區塊標題、卡片標題
    xl:      22px  | line-height: 1.4  — 頁面子標題、部門名稱
    2xl:     28px  | line-height: 1.3  — 頁面主標題
    3xl:     36px  | line-height: 1.2  — 英雄數字、Dashboard 總覽數據
    display: 48px  | line-height: 1.1  — Cagliostro 專用，儀表板名稱（極少使用）
  weight:
    regular:  400  — body 預設
    medium:   500  — body 強調、heading 預設
    semibold: 600  — heading 強調（慎用）
```

---

## 3. 色彩系統

### 設計決策

以 `#cc7a60`（H:18° S:51% L:59%）為 Primary，全系統從此色調發想。參考 skillsmp.com：暖奶白背景、潔白卡片、極細邊框、Terminal/CLI 美學元素。全系統禁止飽和色，所有色彩必須降彩度 20-30%。暖色溫貫穿整個系統（背景、文字、邊框都帶微暖黃調）。

**色彩推導邏輯：**
- 背景：保留暖調，極度提亮 → 奶白
- Secondary：互補方向取冷調，但降飽和 → 莫蘭迪灰藍綠
- 文字：壓暗暖棕，不用純黑
- 狀態色：各方向取色後統一降飽和至 Morandi 調

### 色票

```
colors:
  # 主色
  primary:          #cc7a60   — 磚赭。主操作色、cursor、重點數字
  primary-hover:    #b86d54   — 深一階磚赭。hover、active 狀態
  primary-subtle:   #F0DDD6   — 極淡磚赭。primary 背景 tint、選中行背景

  # 次色
  secondary:        #7A9B94   — 莫蘭迪灰藍綠。次要互動、tag、> 符號、關鍵字高亮
  secondary-hover:  #6A8B84   — 深一階
  secondary-subtle: #DDE8E6   — 極淡灰綠。secondary tint

  # 背景與表面
  background:       #F8F5F1   — 暖奶白。頁面底色，帶極微暖調
  surface:          #FFFFFF   — 純白。卡片、面板、輸入框背景
  surface-raised:   #F3EFE9   — 暖灰。hover 狀態、zebra stripe、略微突出的區塊
  surface-overlay:  #EDEBE6   — 更深暖灰。modal 遮罩底、dropdown 背景

  # 文字
  text-primary:     #2C2420   — 深暖棕黑。主要文字，替代純黑
  text-secondary:   #7A6E68   — 中暖灰棕。次要文字、說明、placeholder label
  text-muted:       #ADA39C   — 淺暖灰。禁用、時間戳記、次級 metadata
  text-inverse:     #F8F5F1   — 反色文字。用於深色背景上

  # 邊框
  border:           #E5E0DA   — 暖淺灰。一般邊框、分隔線
  border-strong:    #CBC5BE   — 中暖灰。強調邊框、focus ring 底色
  border-focus:     #cc7a60   — primary。focus ring 最外圈

  # 狀態色（全部 Morandi 降飽和處理）
  error:            #C47A7A   — 灰調玫紅（不飽和）
  error-subtle:     #F5E5E5   — 極淡玫紅背景 tint
  warning:          #C4A060   — 灰調琥珀（不飽和）
  warning-subtle:   #F5EDD8   — 極淡琥珀 tint
  success:          #7A9B7E   — 灰調灰綠（不飽和）
  success-subtle:   #DDE8DE   — 極淡灰綠 tint
  info:             #7A8FA3   — 莫蘭迪藍灰
  info-subtle:      #DDE4EC   — 極淡藍灰 tint
```

### 色彩使用規則

1. **背景層次**：`background` → `surface` → `surface-raised` → `surface-overlay`，四層區分
2. **文字層次**：`text-primary` → `text-secondary` → `text-muted`，三層足夠
3. **Primary 預算**：`#cc7a60` 是唯一溫暖的聲音，每個視圖中限制使用量，避免失去強調意義
4. **狀態色使用**：僅用於語義明確的狀態指示，禁止用作裝飾
5. **禁止漸層**：所有色彩均為平面色（flat color），不使用漸層填充

---

## 4. 間距系統

### 基礎單位：4px grid

```
spacing:
  base: 4px
  scale:
    1:   4px    — 內聯元素間距（icon 與文字）
    2:   8px    — 緊湊間距（表格 cell padding、badge 內距）
    3:  12px    — 預設內距（按鈕 padding、輸入框 padding）
    4:  16px    — 卡片內距、列表項間距
    6:  24px    — 區塊內間距、卡片間 gap
    8:  32px    — 區塊間距、section 分隔
    12: 48px    — 大區塊間距（部門區塊之間）
    16: 64px    — 頁面級間距（header 與內容區）
    24: 96px    — 極少使用（頁面頂部留白）
```

### 間距使用原則

- **卡片內距**：統一 `16px`（spacing-4）
- **卡片間 gap**：統一 `24px`（spacing-6）
- **section 間距**：統一 `32px`（spacing-8）
- **部門區塊間距**：統一 `48px`（spacing-12）
- 禁止使用非 4px 倍數的間距值

---

## 5. 元件語言

### Border Radius

```
border-radius:
  none:  0px    — 表格、分隔線、progress bar
  xs:    2px    — tag、badge、inline code
  sm:    4px    — 按鈕、輸入框、小卡片（預設）
  md:    6px    — 一般卡片、dropdown
  lg:    8px    — 模態框、側邊面板
  xl:    12px   — macOS 風格 terminal 視窗（模仿 skillsmp 的 window chrome）
```

**禁止**：所有元素統一使用大圓角（16px+）。

### Shadow（陰影層次）

```
shadow:
  flat:     none
            — 預設狀態。Information density 優先

  raised:   0 1px 3px rgba(44, 36, 32, 0.08)
            — hover 狀態、active card

  floating: 0 4px 12px rgba(44, 36, 32, 0.12)
            — dropdown、tooltip、modal
```

**原則**：預設狀態 flat，陰影僅在互動時出現。陰影色使用 `text-primary`（#2C2420）的 rgba 變體，不使用純黑。

### 按鈕風格

```
buttons:
  primary:
    bg: #cc7a60 (primary)
    text: #FFFFFF
    border: none
    border-radius: sm (4px)
    — 主要操作：儲存、確認、執行

  secondary:
    bg: transparent
    text: #cc7a60 (primary)
    border: 1px solid #cc7a60
    border-radius: sm (4px)
    — 次要操作：取消、返回、篩選

  ghost:
    bg: transparent
    text: #7A6E68 (text-secondary)
    border: 1px solid #E5E0DA (border)
    border-radius: sm (4px)
    — 低調操作：展開/收合、切換視圖

  danger:
    bg: #C47A7A (error)
    text: #FFFFFF
    border: none
    border-radius: sm (4px)
    — 破壞性操作：刪除、重置、斷開連線
```

---

## 6. Terminal 美學元素

Nexus 借用 CLI 視覺語言（參考 skillsmp.com），將 Terminal 美學融入介面文法：

```
terminal:
  window-chrome:    macOS 三點（#cc7a60 / #C4A060 / #7A9B7E）
                    — 卡片頂部裝飾，模擬 terminal 視窗標題列

  prompt-symbol:    >
                    color: #7A9B94 (secondary)
                    font: mononoki (mono)
                    — 部門標題前綴

  command-symbol:   $
                    color: #ADA39C (text-muted)
                    font: mononoki (mono)
                    — 操作指令標示

  cursor-block:     █
                    color: #cc7a60 (primary)
                    — Cagliostro 標題後的游標裝飾

  keyword-color:    #7A9B94 (secondary)
                    — 程式碼關鍵字（const, from 等）

  value-color:      #cc7a60 (primary)
                    — 數值高亮
```

---

## 7. AI Slop 禁用清單

以下設計元素 **禁止** 出現於 Nexus Dashboard 的任何頁面：

| # | 反模式 | 禁止理由 |
|---|---|---|
| 1 | 紫色 / 靛藍 / 藍紫漸層（任何形式） | AI 生成設計的第一特徵，與 Morandi 低彩度直接衝突 |
| 2 | 飽和橘色（#ff6b35 等高飽和版本） | primary 只用 #cc7a60 灰調版，禁止高飽和變體 |
| 3 | 彩色圓圈包裹 icon 的 3-column feature grid | SaaS landing page 模板，不屬於指揮室 |
| 4 | 大圓角（border-radius >= 16px）統一套用 | 破壞 Terminal 精確感，變成 Playful/Toy-like |
| 5 | 漸層按鈕（gradient CTA） | 與 Morandi 平面色原則衝突 |
| 6 | 裝飾性 blob、浮動圓形、波浪 SVG | 純裝飾元素，在指揮室中零資訊量 |
| 7 | Emoji 作為介面設計元素 | 破壞專業調性 |
| 8 | 純黑（#000000）或純白（#FFFFFF）作為背景 | 背景用 #F8F5F1 暖奶白，surface 用 #FFFFFF 僅限卡片內 |
| 9 | 置中對齊所有標題與卡片 | 資料密集儀表板以左對齊為基礎，數字右對齊 |
| 10 | 全站一致的卡片左色邊框 | AI 模板常見手法，與整體設計語言不符 |

---

## 8. 設計原則

### 原則 1：決策密度優先

每個卡片只問一個問題。資訊層次靠色差（primary → secondary → muted），不靠裝飾。留白是為了區分層次，不是為了裝飾。

**實踐**：卡片內距 16px 而非 24px；字型 base 15px 而非 16px；間距用 4px grid 精確控制。

### 原則 2：Terminal 有機感

CLI 視覺語言（>、$、monospace）不是裝飾，是介面文法的一部分。window-chrome 三點、prompt-symbol、cursor-block 構成 Nexus 的視覺身份，讓資訊結構自帶呼吸感。

**實踐**：部門標題使用 `> Department` 格式（mono + secondary）；英雄數字後方附帶 `█` cursor（primary）。

### 原則 3：Morandi 克制

`#cc7a60` 是唯一溫暖的聲音。其他一切退後，讓數據說話。Secondary、狀態色、邊框全部降飽和至灰調，確保 primary 磚赭在畫面中的絕對視覺優先權。

**實踐**：每個視圖中 primary 色元素控制在 3-5 處以內，其餘用 text-secondary / text-muted / border 灰調系統。

---

## 附錄：AI Slop 自檢結果

- [x] 無紫色 / 靛藍 / 藍紫漸層
- [x] 無飽和橘色（僅用 #cc7a60 灰調磚赭）
- [x] 無彩色圓圈 icon 的 feature grid
- [x] 無統一大圓角（預設 sm 4px，最大 xl 12px）
- [x] 無漸層按鈕
- [x] 無裝飾性 blob / 波浪 SVG
- [x] 無 Emoji 作為設計元素
- [x] 無純黑 / 純白背景
- [x] 無置中對齊一切
- [x] 無全站卡片左色邊框

---

*本文件為 Nexus Dashboard v0.2 的設計憲法。所有前端實作必須遵守此規範。偏離需經 Architect-Office 審核。*
