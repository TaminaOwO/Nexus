# Proposal: docs-refactoring

## Why
目前專案內 Markdown 檔案新舊交錯、位置分散（如 `design-system/nexus` 下的 `TODO.md`、根目錄的 `CLAUDE.md` 等），容易讓 AI 產生幻覺。需建立「唯一真理來源」。

## What Changes
1. 建立 `docs/` 存放開發文件。
2. 遷移 `design-system/nexus/pages/` 下的舊規格與 `MASTER.MD` 至 `openspec/specs/` 對應模組。
3. 檢視並清理 `design-system/nexus/` 下的 `TODO.md`。
4. 整理根目錄的 `CLAUDE.md` 以及 `docs/PRODUCT.md`。
5. 統一規格書格式為 BDD (`WHEN... AND... THEN...`) 與 kebab-case 命名。

## Impact
- 專案根目錄
- `design-system/nexus/`
- `docs/`
- `openspec/specs/`
