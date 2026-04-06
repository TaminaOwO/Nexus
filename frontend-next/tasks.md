# NEXUS-003 Tasks — Life 部門通電

## Task 1 — AC-1: TypeScript 型別定義 + API Fetchers
- 在 `nexus-backend.ts` 新增 `HealthRecord`, `SkincareStep`, `SkincareRoutine` interfaces
- 新增 `getHealthLatest()`, `getSkincareToday()`, `getSkincareCycle()` fetcher functions
- 測試：verify interface 結構與 fetcher 呼叫路徑、headers

## Task 2 — AC-4: X-API-Key 標頭驗證
- 測試：`fetchFromBackend` 在每次請求中正確帶入 `X-API-Key` header
- (已存在於 fetchFromBackend，需測試驗證)

## Task 3 — AC-2: HealthCycleCard 動態化
- 移除 `METRICS` 靜態陣列
- 接收 `HealthRecord` + cycle info props，動態渲染體脂/睡眠/靜止心率
- DB 為空時顯示 N/A
- 測試：props 注入後正確渲染；null 值顯示 N/A

## Task 4 — AC-3: SkincareCard 動態化
- 移除 `AM_STEPS`/`PM_STEPS` 常數
- 接收 `SkincareRoutine` props，渲染 AM/PM 步驟 + badges + banned 區域
- 測試：props 注入後正確渲染 AM/PM 列表與 banned 警告

## Task 5 — AC-5: 日期歸屬正確性
- 確認前端直接使用後端回傳的 `record_date` 字串，不做本地時區轉換
- 測試：凌晨 00:30 入睡的 record_date 直接透傳顯示

## Task 6 — LifePage 整合
- 在 `page.tsx` 呼叫新增的 fetchers，注入 props 至各 component
- 測試：page 正確呼叫 fetchers 並傳遞 data 至子元件
