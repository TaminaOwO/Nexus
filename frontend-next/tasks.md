# NEXUS-004 Tasks — Omni-Comm 全局指令中心

## Task 1 — AC-2: `lib/github.ts` createOrUpdateFile 寫入功能
- 在 `lib/github.ts` 新增 `createOrUpdateFile(path, content, message)` 方法
- 使用 `getOctokit().repos.createOrUpdateFileContents`
- content 自動轉 Base64
- 10 秒 timeout（已在 Octokit 初始化設定）
- 測試：mock Octokit，驗證呼叫參數與 Base64 轉換

## Task 2 — AC-6: API 路由缺少 GITHUB_PAT 時回傳 500
- 建立 `/api/omni-comm/dispatch/route.ts`
- 當 `GITHUB_PAT` 未設定時回傳 `{ error: "GITHUB_PAT is not configured" }` + HTTP 500
- 測試：未設定 GITHUB_PAT 時回傳 500 錯誤

## Task 3 — AC-3: Dispatch API 路由核心邏輯
- 解析 POST body 的 `hashtag` 對應路徑（`#req` → `Dev/Architect-Office/inbox/`）
- 生成 Markdown 內容（含 Frontmatter: date, source, hashtag）
- 調用 `createOrUpdateFile` 寫入 GitHub
- 回傳成功 JSON
- 測試：mock github.ts，驗證路徑映射、Markdown 生成、成功回傳

## Task 4 — AC-5: Dispatch API 錯誤處理
- GitHub API 失敗時回傳 `{ error: "<具體錯誤>" }` + HTTP 500
- 測試：mock createOrUpdateFile throw error，驗證錯誤訊息回傳

## Task 5 — AC-1: OmniComm 元件 Cmd+K 觸發
- 建立 `OmniComm.tsx` client component
- `Cmd+K` / `Ctrl+K` 切換指令面板顯示
- 包含文字輸入框 + 送出按鈕
- 測試：模擬 Cmd+K 按鍵，驗證面板顯示/隱藏

## Task 6 — AC-4: OmniComm 成功 Toast + git pull 提醒
- 送出期間顯示 Loading Spinner
- 成功後彈出 Toast：「已送出至遠端，請在本地執行 git pull 同步」
- 掛載於 `layout.tsx`
- 測試：mock fetch dispatch API，驗證 loading 狀態與 Toast 文案
