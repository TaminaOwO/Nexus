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

// ── Life: Health ─────────────────────────────

export interface HealthRecord {
  body_fat_pct: number | null
  weight_kg: number | null
  sleep_hours: number | null
  resting_hr: number | null
  record_date: string
}

export async function getHealthLatest(): Promise<HealthRecord> {
  return fetchFromBackend<HealthRecord>('/api/v1/life/health/latest')
}

export interface HealthRecommendation {
  health: string
  diet: string
  training: string
  generated_at: string
}

export async function getHealthRecommendation(): Promise<HealthRecommendation> {
  return fetchFromBackend<HealthRecommendation>('/api/v1/life/health/recommendation')
}

// ── Life: Skincare ───────────────────────────

export interface SkincareStep {
  product: string
  badges?: string[]
  is_optional: boolean
}

export interface SkincareRoutine {
  am: SkincareStep[]
  pm: SkincareStep[]
  banned: string[]
  phase: string
  mode: string
}

export interface SkincareCycle {
  day?: number
  current_day: number
  phase: string
}

export async function getSkincareToday(): Promise<SkincareRoutine> {
  return fetchFromBackend<SkincareRoutine>('/api/v1/life/skincare/today')
}

export async function getSkincareCycle(): Promise<SkincareCycle> {
  return fetchFromBackend<SkincareCycle>('/api/v1/life/skincare/cycle')
}

// ── Life: Career Coach ───────────────────────

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
  fetch_status?: 'ok' | 'error'
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

// ── Kite: Strategy Indicators (NEXUS-005-R1) ──

export interface StrategyCondition {
  label: string
  indicators: string[]
  operator: string
  left_field: string
  right_field?: string
  right_value?: number | null
}

export interface StrategyDefinition {
  id: string
  name: string
  category: string
  conditions: StrategyCondition[]
  display_conditions?: string[]
}

export interface StockIndicator {
  symbol: string
  name: string
  price: number | null
  change_pct: number | null
  macd_dif: number | null
  macd_macd: number | null
  macd_histogram: number | null
  ma5: number | null
  ma20: number | null
  ma60: number | null
  yesterday_close: number | null
  volume: number | null
  monthly_revenue_growth: number | null
  cumulative_revenue_growth: number | null
  weekly_macd_dif: number | null
  weekly_macd_histogram: number | null
}

export async function getStrategyDefinitions(): Promise<{ data: StrategyDefinition[] }> {
  return fetchFromBackend('/api/v1/kite/strategy/definitions')
}

export async function getStrategyIndicators(strategyId: string): Promise<{ data: StockIndicator[] }> {
  return fetchFromBackend(`/api/v1/kite/strategy/indicators?strategy_id=${encodeURIComponent(strategyId)}`)
}

