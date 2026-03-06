## Context

`src/App.tsx` 同時承載主導覽、路由設定與首頁三個職責。Choice-Fit 的入口散落在這三處，需要一併清除。後端 `internal/modules/choicefit/` 保留不動。

## Goals / Non-Goals

**Goals:**
- 從 UI 移除所有 Choice-Fit 可見入口（nav link、Home card）
- 保留 `/choice-fit` route 定義（避免 404，但使用者不會從 UI 觸及）

**Non-Goals:**
- 刪除後端 choicefit 模組
- 刪除前端 `src/apps/choicefit/` 程式碼
- 修改任何路由權限或 API

## Decisions

**保留 route，移除入口**：不刪除 `<Route path="/choice-fit/*">` 以避免直接輸入 URL 出現 500。只移除 nav link 與 Home card，讓模組安靜地存在但不可見。

**不加 feature flag**：暫停期間不需要 toggle，直接移除即可。恢復時重新加入。

## Risks / Trade-offs

- [Risk] 日後恢復需手動重加 nav/card → 接受，變更很小且有 git history 可查
