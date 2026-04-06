# Nexus Frontend — MANIFEST

## Tech Stack
- **Framework**: Next.js 16.2.0 (App Router, `use client` components)
- **Language**: TypeScript 5
- **UI**: React 19, Tailwind CSS 3.4, Lucide Icons
- **Testing**: Vitest 4.x, @testing-library/react, jsdom
- **Package Manager**: npm

## Project Structure
```
src/
  app/
    life/
      page.tsx                        # Life department page (Server Component)
  app/
    api/
      omni-comm/
        dispatch/
          route.ts                 # POST dispatch — hashtag→GitHub file write
    life/
      page.tsx                        # Life department page (Server Component)
  components/
    OmniComm.tsx                 # Global command palette (Cmd+K) — dispatch to HQ repo
    kite/           # Kite trading dashboard components
      FloatingStrategyPanel.tsx   # Strategy conditions sidebar panel
      IndicatorTable.tsx
      KiteDashboard.tsx
      MarketPanel.tsx
      PortfolioPanel.tsx
      StrategyPanel.tsx
    life/           # Life department components
      CareerCoachCard.tsx         # Career coach data card
      HealthCycleCard.tsx         # Health metrics + cycle display (dynamic)
      SkincareCard.tsx            # Skincare AM/PM routine + banned (dynamic)
      TaskReminderCard.tsx        # Task reminder card
  lib/
    github.ts                     # GitHub API client (read + write via Octokit)
    nexus-backend.ts              # Backend API types & client
```

## Conventions
- Path alias: `@/` maps to `./src/`
- Test files: `*.test.ts` / `*.test.tsx` colocated with source
- Vitest config: `vitest.config.mts`

## Recent Changes
- **2026-04-06** — NEXUS-004: Omni-Comm command palette — `createOrUpdateFile` in github.ts, `/api/omni-comm/dispatch` route, `OmniComm.tsx` (Cmd+K), Toast with git pull reminder. 37 tests passing.
- **2026-04-06** — NEXUS-003: Life department activation — Health/Skincare data from backend API, dynamic HealthCycleCard + SkincareCard, 17 tests passing.
- **2026-04-04** — NEXUS-006-R1 Issue 3: Updated `DISPLAY_CONDITIONS_OVERRIDE` in FloatingStrategyPanel — wind type labels changed from Chinese (全天候/強風/陣風) to English enum values (STRONG, TURBULENT, GUSTY, CALM). Added vitest + first unit test.

## Health
- **Tests**: 37 passing (9 files)
- **Coverage**: nexus-backend fetchers, HealthCycleCard, SkincareCard, LifePage integration, date attribution, github createOrUpdateFile, omni-comm dispatch route, OmniComm component
