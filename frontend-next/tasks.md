# NEXUS-005 Tasks — Marketing 部門建置：Cat-Lab 內容自動化儀表板

## Task 1 — AC-1: Sidebar 啟用 Marketing 連結
- 在 `Sidebar.tsx` 將 Marketing nav item 設為 `enabled: true`，加入 `href: '/marketing'`
- 測試：Marketing link 可點擊，正確連結至 `/marketing`

## Task 2 — AC-2 + AC-6: BFF API Route（快取 + GitHub 介接）
- 新建 `src/app/api/marketing/catlab/route.ts`
- 實作 GET handler：呼叫 `github.ts` 的 `listDirectory` + `getFileContent`
- 使用 `gray-matter` 解析 frontmatter
- 實作記憶體快取（drafts TTL 60s, published TTL 600s）
- 測試：快取命中時不重複呼叫 GitHub API；正確解析 frontmatter

## Task 3 — AC-3 + AC-5: CatLabPostCard 元件
- 新建 `src/components/marketing/CatLabPostCard.tsx`
- 呈現發文標題、Persona 標籤（觀察員/研究員）、狀態（Draft/Published）
- 符合 Morandi 設計系統（bg-white, border-border, font-display 等）
- 測試：正確渲染 props，Persona badge 顯示正確顏色

## Task 4 — AC-4: Skeleton Loading + Error State
- 新建 `src/components/marketing/CatLabSkeleton.tsx`
- 新建 `src/components/marketing/CatLabError.tsx`
- Skeleton 在載入時顯示骨架屏
- Error 在失敗時顯示友善錯誤訊息
- 測試：Skeleton 渲染正確結構；Error 顯示錯誤訊息

## Task 5 — AC-3: Marketing 頁面整合（Published 左欄 / Drafts 右欄）
- 新建 `src/app/marketing/page.tsx`（'use client'）
- 使用 `useSWR` 呼叫 BFF API
- Published 左欄、Drafts 右欄佈局
- 整合 Skeleton / Error / CatLabPostCard
- 測試：頁面渲染正確佈局，SWR 呼叫正確 endpoint

## Task 6 — AC-5: CatRecordTimeline 元件（貓咪作息紀錄）
- 新建 `src/components/marketing/CatRecordTimeline.tsx`
- 視覺化貓咪作息紀錄（若有檔案）
- 符合 Morandi 設計系統
- 測試：正確渲染時間軸數據；無數據時顯示空狀態
