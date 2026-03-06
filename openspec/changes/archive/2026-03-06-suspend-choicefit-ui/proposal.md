## Why

Choice-Fit 學員管理系統的開發計畫暫停，保留後端程式碼但前端入口不應繼續出現在主導覽，避免使用者進入未完成的模組。

## What Changes

- 移除首頁（Home）的 Choice-Fit 模組卡片
- 移除主導覽列的 Choice-Fit 連結與 Icon
- 保留 `/choice-fit` route 及後端程式碼（不刪除，方便日後恢復）

## Capabilities

### New Capabilities

無

### Modified Capabilities

- `nexus-shell`：主導覽與首頁不再顯示 Choice-Fit 入口

## Impact

- `src/App.tsx`：移除 ChoiceFit lazy import、`/choice-fit` route、nav link、Home card
- 無 API / DB 影響
