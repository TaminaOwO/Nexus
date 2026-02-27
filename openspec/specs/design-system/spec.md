# Specification: design-system

## Feature: UI/UX Design Standards

#### Scenario: Color Palette Configuration
- WHEN 套用語意化顏色時 (applying semantic colors)
- THEN Primary 顏色 MUST 為 `#3B82F6` (var(`--color-primary`))
- AND Secondary 顏色 MUST 為 `#60A5FA` (var(`--color-secondary`))
- AND CTA/Accent 顏色 MUST 為 `#F97316` (var(`--color-cta`))
- AND Background 顏色 MUST 為 `#F8FAFC` (var(`--color-background`))
- AND Text 顏色 MUST 為 `#1E293B` (var(`--color-text`))

#### Scenario: Typography Usage
- WHEN 渲染文字內容時
- THEN 標題字體 (heading font) MUST 為 `Caveat`
- AND 內文字體 (body font) MUST 為 `Quicksand`
- AND 視覺風格 SHOULD 呈現手寫、個人化與友善的感受

#### Scenario: Consistent Spacing
- WHEN 套用 margins 或 padding 時
- THEN space-xs MUST 為 4px
- AND space-sm MUST 為 8px
- AND space-md MUST 為 16px
- AND space-lg MUST 為 24px
- AND space-xl MUST 為 32px
- AND space-2xl MUST 為 48px
- AND space-3xl MUST 為 64px

#### Scenario: Interactive Elements (Buttons and Cards)
- WHEN 使用者與可點擊元素互動時
- THEN Primary 按鈕 MUST 使用 `#F97316` 背景與白色文字
- AND Secondary 按鈕 MUST 使用透明背景與 `#3B82F6` 邊框
- AND 所有可點擊元素 MUST 具備 `cursor: pointer`
- AND Hover 狀態 MUST 包含平滑轉場動畫 (150-300ms)
- AND Hover 狀態 MUST 套用陰影效果 (var(`--shadow-lg`))

#### Scenario: Forms and Modals
- WHEN 顯示輸入表單或互動視窗 (Modals) 時
- THEN 輸入框 MUST 有 1px 實線邊框 (`#E2E8F0`) 與 8px 圓角
- AND 輸入框 focus 狀態 MUST 有明顯的外框 (`0 0 0 3px #3B82F620`)
- AND Modals MUST 具備模糊背景 (blurred overlay) 且最大寬度為 500px

#### Scenario: Pre-Delivery UI Quality Checks & Anti-Patterns
- WHEN 交付 UI 程式碼時
- THEN 絕對禁止 (MUST NOT) 使用原生 Emoji 作為 Icon (必須使用 Heroicons/Lucide 的 SVG)
- AND 絕對禁止 (MUST NOT) 發生 Hover 導致版面偏移 (layout-shifting) 的狀況
- AND 文字對比度 MUST 至少達到 4.5:1
- AND 鍵盤導覽的 Focus 狀態 MUST 清楚可見
- AND 行動裝置版面 MUST 防止產生水平捲動 (horizontal scroll)