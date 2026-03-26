const NEXUS_BACKEND_URL = process.env.NEXUS_BACKEND_URL
const NEXUS_API_KEY = process.env.NEXUS_API_KEY

async function fetchFromBackend<T>(path: string): Promise<T> {
  if (!NEXUS_BACKEND_URL) {
    throw new Error('NEXUS_BACKEND_URL is not set')
  }
  const res = await fetch(`${NEXUS_BACKEND_URL}${path}`, {
    headers: { 'X-API-Key': NEXUS_API_KEY ?? '' },
    next: { revalidate: 300 }, // ISR 5 minutes
    signal: AbortSignal.timeout(10_000), // 10s timeout
  })
  if (!res.ok) throw new Error(`nexus-backend error: ${res.status}`)
  return res.json()
}

// ── Life ──────────────────────────────────────

export interface CareerCoachData {
  targetDate: string
  phase: string
  domains: { name: string; progress: number }[]
  overdueTodos: string[]
  streak: number
}

export async function getCareerCoachData(): Promise<CareerCoachData> {
  return fetchFromBackend<CareerCoachData>('/api/v1/life/career-coach')
}

// ── Kite: Market ──────────────────────────────

export interface MarketIndex {
  id: number
  symbol: string
  name: string
  price: number
  change: number
  change_pct: number | null
  extra_json?: Record<string, unknown>
  fetched_at: string
}

export async function getMarketIndex(): Promise<{ data: MarketIndex[] }> {
  return fetchFromBackend('/api/v1/kite/market/index')
}

export async function getMarketFutures(): Promise<{ data: MarketIndex }> {
  return fetchFromBackend('/api/v1/kite/market/futures')
}

// ── Kite: Strategy ────────────────────────────

export interface StrategyStock {
  id: number
  strategy_id: string
  symbol: string
  name: string | null
  price: number | null
  change: number | null
  change_pct: number | null
  extra_json?: Record<string, unknown>
  fetched_date: string
  fetched_at: string
}

export interface StrategyStat {
  strategy_id: string
  today: number
  yesterday: number
  diff: number
}

export async function getStrategyOffice(): Promise<{ data: StrategyStock[] }> {
  return fetchFromBackend('/api/v1/kite/strategy/office')
}

export async function getStrategyWorker(): Promise<{ data: StrategyStock[] }> {
  return fetchFromBackend('/api/v1/kite/strategy/worker')
}

export async function getStrategyBoss(): Promise<{ data: StrategyStock[] }> {
  return fetchFromBackend('/api/v1/kite/strategy/boss')
}

export async function getStrategyStats(): Promise<{ data: StrategyStat[] }> {
  return fetchFromBackend('/api/v1/kite/strategy/stats')
}

// ── Kite: Portfolio ───────────────────────────

export interface PortfolioPosition {
  symbol: string
  name: string
  shares: number
  cost_basis: number
  current_price: number
  momentum_alert: boolean
}

export async function getPortfolio(): Promise<{ data: PortfolioPosition[] }> {
  return fetchFromBackend('/api/v1/kite/portfolio')
}
