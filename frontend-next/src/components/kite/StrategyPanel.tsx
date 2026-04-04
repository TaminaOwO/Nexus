'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowUpDown, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import FloatingStrategyPanel from './FloatingStrategyPanel'
import type { StrategyStock, StrategyDefinition, StockIndicator, StrategyCondition } from '@/lib/nexus-backend'

// Wind code to Chinese label mapping (matches KiteDashboard WIND_CODE_MAP values)
const WIND_LABEL: Record<string, string> = {
  strong: '強風',
  turbulence: '亂流',
  gust: '陣風',
  none: '無風',
}

// Which wind codes each strategy category accepts
const BOSS_WIND_ACCEPT = new Set(['strong', 'turbulence', 'gust', 'none']) // all-weather
const OFFICE_WIND_ACCEPT = new Set(['strong', 'gust'])

interface StrategyPanelProps {
  stocks: StrategyStock[]
  category: 'boss' | 'office' | 'worker'
  strategyDefinitions: StrategyDefinition[]
  windCode?: string
}

const CATEGORY_CONFIG = {
  boss: {
    title: '老闆型策略選股',
    strategies: [
      { id: 'boss_cheap', label: '低廉股' },
      { id: 'boss_pullback', label: '拉回股' },
    ],
  },
  office: {
    title: '上班族型策略選股',
    strategies: [
      { id: 'office_strong', label: '強勢股' },
      { id: 'office_trend', label: '趨勢股' },
    ],
  },
  worker: {
    title: '打工型策略選股',
    strategies: [
      { id: 'worker_strong', label: '強勢日' },
      { id: 'worker_pullback', label: '日拉回' },
    ],
  },
} as const

// Sort configuration type supporting primary + secondary sort
type SortConfig = { key: string; direction: 'asc' | 'desc' }

// Get a sortable value from a stock, supporting both top-level and extra_json fields
function getSortValue(stock: StrategyStock, key: string): number | string | null {
  if (key === 'volume' || key === 'monthly_revenue_growth' || key === 'cumulative_revenue_growth') {
    const val = stock.extra_json?.[key]
    return typeof val === 'number' ? val : null
  }
  const val = (stock as unknown as Record<string, unknown>)[key]
  return val == null ? null : (val as number | string)
}

// Compare two values for sorting; nulls sort to end
function compareValues(aVal: number | string | null, bVal: number | string | null, direction: 'asc' | 'desc'): number {
  if (aVal == null && bVal == null) return 0
  if (aVal == null) return 1
  if (bVal == null) return -1
  if (aVal < bVal) return direction === 'asc' ? -1 : 1
  if (aVal > bVal) return direction === 'asc' ? 1 : -1
  return 0
}

// Default sort configs per category
const DEFAULT_SORT: Record<string, SortConfig[]> = {
  worker: [
    { key: 'volume', direction: 'desc' },
    { key: 'monthly_revenue_growth', direction: 'desc' },
  ],
  office: [
    { key: 'volume', direction: 'desc' },
    { key: 'monthly_revenue_growth', direction: 'desc' },
  ],
  boss: [
    { key: 'monthly_revenue_growth', direction: 'desc' },
    { key: 'volume', direction: 'desc' },
  ],
}

// Human-readable labels for indicator fields
const INDICATOR_LABELS: Record<string, string> = {
  macd_dif: 'MACD DIF',
  macd_macd: 'MACD Signal',
  macd_histogram: 'Histogram',
  ma5: '5MA',
  ma20: '20MA',
  ma60: '60MA',
  yesterday_close: '昨日收盤價',
  close: '收盤',
}

// Fixed display order for expanded indicator row (Issue 2: NEXUS-006-R1)
const EXPANDED_INDICATOR_FIELDS = ['ma5', 'ma20', 'ma60', 'yesterday_close'] as const

// Get a numeric value from a stock indicator by field name
function getIndicatorFieldValue(stock: StockIndicator, field: string): number | null {
  if (field === 'close') return stock.price
  if (field === 'yesterday_close') return stock.yesterday_close
  if (field === 'monthly_revenue_growth') return stock.monthly_revenue_growth
  if (field === 'weekly_macd_dif') return stock.weekly_macd_dif
  if (field === 'weekly_macd_histogram') return stock.weekly_macd_histogram
  const val = (stock as unknown as Record<string, unknown>)[field]
  return typeof val === 'number' ? val : null
}

// Evaluate a single condition against a stock
function evaluateCondition(cond: StrategyCondition, stock: StockIndicator): boolean | null {
  const leftVal = getIndicatorFieldValue(stock, cond.left_field)
  if (leftVal === null) return null

  let rightVal: number | null
  if (cond.right_value !== undefined && cond.right_value !== null) {
    rightVal = cond.right_value
  } else if (cond.right_field) {
    rightVal = getIndicatorFieldValue(stock, cond.right_field)
  } else {
    return null
  }

  if (rightVal === null) return null

  switch (cond.operator) {
    case '>': return leftVal > rightVal
    case '<': return leftVal < rightVal
    case '>=': return leftVal >= rightVal
    case '<=': return leftVal <= rightVal
    case '==': return leftVal === rightVal
    default: return null
  }
}

function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined) return '--'
  return val.toFixed(2)
}

// ── Condition Tag ─────────────────────────────
interface ConditionTag {
  pass: boolean | null
  label: string
}

function buildBossTags(indicator: StockIndicator, windCode: string): ConditionTag[] {
  // 1. Wind — boss is all-weather
  const windPass = BOSS_WIND_ACCEPT.has(windCode)
  const windLabel = WIND_LABEL[windCode] || windCode
  const windSuffix = windPass ? '（全天候）' : ''

  // 2. Revenue YOY > 30%
  const rev = indicator.monthly_revenue_growth
  const revPass = rev !== null ? rev > 30 : null
  const revLabel = rev !== null ? `營收 ${rev >= 0 ? '+' : ''}${rev.toFixed(1)}%` : '營收 --'

  // 3. MA20 distance: abs((price - ma20) / ma20 * 100) <= 3%
  const price = indicator.price
  const ma20 = indicator.ma20
  let distPass: boolean | null = null
  let distLabel = '距月線 --'
  if (price !== null && ma20 !== null && ma20 !== 0) {
    const dist = (price - ma20) / ma20 * 100
    distPass = Math.abs(dist) <= 3
    distLabel = `距月線 ${dist >= 0 ? '+' : ''}${dist.toFixed(1)}%`
  }

  return [
    { pass: windPass, label: `${windLabel}${windSuffix}` },
    { pass: revPass, label: revLabel },
    { pass: distPass, label: distLabel },
  ]
}

function buildOfficeTags(indicator: StockIndicator, windCode: string, strategyId: string): ConditionTag[] {
  // 1. Wind — office accepts strong + gust
  const windPass = OFFICE_WIND_ACCEPT.has(windCode)
  const windLabel = WIND_LABEL[windCode] || windCode

  // 2. Weekly MACD trend up (weekly_macd_histogram > 0)
  const wHist = indicator.weekly_macd_histogram
  const wHistPass = wHist !== null ? wHist > 0 : null
  const wHistLabel = wHist !== null
    ? `週MACD ${wHist > 0 ? '上升' : '下降'}`
    : '週MACD --'

  const tags: ConditionTag[] = [
    { pass: windPass, label: windLabel },
    { pass: wHistPass, label: wHistLabel },
  ]

  if (strategyId === 'office_strong') {
    // 3. Daily MACD histogram > 0 (red bar)
    const dHist = indicator.macd_histogram
    const dHistPass = dHist !== null ? dHist > 0 : null
    const dHistLabel = dHist !== null
      ? `日MACD ${dHist > 0 ? '紅柱' : '綠柱'}`
      : '日MACD --'
    tags.push({ pass: dHistPass, label: dHistLabel })
  } else if (strategyId === 'office_trend') {
    // 3. Price near MA5 (within 1.5%)
    const price = indicator.price
    const ma5 = indicator.ma5
    let ma5Pass: boolean | null = null
    let ma5Label = '距日線 --'
    if (price !== null && ma5 !== null && ma5 !== 0) {
      const dist = (price - ma5) / ma5 * 100
      ma5Pass = Math.abs(dist) <= 1.5
      ma5Label = `距日線 ${dist >= 0 ? '+' : ''}${dist.toFixed(1)}%`
    }
    tags.push({ pass: ma5Pass, label: ma5Label })
  }

  return tags
}

function ConditionTagBadge({ tag }: { tag: ConditionTag }) {
  const cls = tag.pass === null
    ? 'bg-gray-100 text-gray-400'
    : tag.pass
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {tag.pass === null ? (
        <span>-</span>
      ) : tag.pass ? (
        <Check className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
      {tag.label}
    </span>
  )
}

// ── Expandable Indicator Row ──────────────────
function ExpandedIndicatorRow({
  indicator,
  definition,
  colSpan,
  windCode,
}: {
  indicator: StockIndicator | null
  definition: StrategyDefinition
  colSpan: number
  windCode: string
}) {
  if (!indicator) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-4 bg-gray-50/50">
          <p className="text-sm text-text-muted italic text-center">指標數據載入中…</p>
        </td>
      </tr>
    )
  }

  // Determine tags based on category
  const category = definition.category
  const strategyId = definition.id
  let tags: ConditionTag[]
  if (category === 'boss') {
    tags = buildBossTags(indicator, windCode)
  } else if (category === 'office') {
    tags = buildOfficeTags(indicator, windCode, strategyId)
  } else {
    // Worker: keep original generic evaluation
    tags = definition.conditions.map((cond) => {
      const result = evaluateCondition(cond, indicator)
      return { pass: result, label: cond.label }
    })
  }

  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <div className="bg-slate-50 border-t border-b border-blue-100 px-6 py-4 space-y-3 animate-in">
          {/* Indicator values — fixed order: 5MA → 20MA → 60MA → 昨日收盤價 */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {EXPANDED_INDICATOR_FIELDS.map((field) => {
              const val = getIndicatorFieldValue(indicator, field)
              return (
                <div key={field} className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-sans uppercase tracking-wider">
                    {INDICATOR_LABELS[field] || field}
                  </span>
                  <span className="text-sm font-mono font-semibold text-text-primary">
                    {fmt(val)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Condition tags — category-specific */}
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag, idx) => (
              <ConditionTagBadge key={idx} tag={tag} />
            ))}
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Stock Table with expandable rows ──────────
function StockTable({
  stocks,
  category,
  indicatorData,
  definition,
  windCode,
}: {
  stocks: StrategyStock[]
  category: 'boss' | 'office' | 'worker'
  indicatorData: StockIndicator[]
  definition: StrategyDefinition | null
  windCode: string
}) {
  const defaultSort = DEFAULT_SORT[category]
  const [sortConfig, setSortConfig] = useState<SortConfig[]>(defaultSort)
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)

  const handleSort = (key: string) => {
    const current = sortConfig[0]
    let direction: 'asc' | 'desc' = 'desc'
    if (current && current.key === key && current.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig([{ key, direction }])
  }

  const sortedStocks = [...stocks].sort((a, b) => {
    for (const { key, direction } of sortConfig) {
      const aVal = getSortValue(a, key)
      const bVal = getSortValue(b, key)
      const cmp = compareValues(aVal, bVal, direction)
      if (cmp !== 0) return cmp
    }
    return 0
  })

  // Build a lookup map for indicator data by symbol
  const indicatorMap = useMemo(() => {
    const map = new Map<string, StockIndicator>()
    for (const ind of indicatorData) {
      map.set(ind.symbol, ind)
    }
    return map
  }, [indicatorData])

  // Extract revenue and volume fields from extra_json
  const getExtraFields = (stock: StrategyStock) => {
    const monthly = stock.extra_json?.monthly_revenue_growth
    const cumulative = stock.extra_json?.cumulative_revenue_growth
    const volume = stock.extra_json?.volume
    return {
      monthly: typeof monthly === 'number' ? monthly : null,
      cumulative: typeof cumulative === 'number' ? cumulative : null,
      volume: typeof volume === 'number' ? volume : null,
    }
  }

  const toggleExpand = (symbol: string) => {
    setExpandedSymbol((prev) => (prev === symbol ? null : symbol))
  }

  const SortIndicator = ({ sortKey }: { sortKey: string }) => (
    <span className="inline-flex items-center gap-0.5">
      <ArrowUpDown className="w-3 h-3" />
      {sortConfig[0]?.key === sortKey && (
        <span className="text-primary text-[10px]">{sortConfig[0].direction === 'desc' ? '▼' : '▲'}</span>
      )}
    </span>
  )

  const COL_SPAN = 5 // number of columns in the table

  return (
    <div>
      {/* 4-Column Header + expand column */}
      <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1.5fr_32px] gap-2 px-4 py-3 bg-background text-text-secondary text-xs tracking-wider font-sans border-b border-border">
        <span className="font-semibold cursor-pointer flex items-center gap-1" onClick={() => handleSort('name')}>
          股票 <SortIndicator sortKey="name" />
        </span>
        <span className="font-semibold cursor-pointer flex items-center gap-1" onClick={() => handleSort('price')}>
          股價 <SortIndicator sortKey="price" />
        </span>
        <span className="font-semibold cursor-pointer flex items-center gap-1" onClick={() => handleSort('volume')}>
          成交金額(億) <SortIndicator sortKey="volume" />
        </span>
        <span className="font-semibold cursor-pointer flex items-center gap-1" onClick={() => handleSort('monthly_revenue_growth')}>
          營收成長 <SortIndicator sortKey="monthly_revenue_growth" />
        </span>
        <span>{/* expand icon column */}</span>
      </div>

      {/* Stock List */}
      <div className="divide-y divide-border">
        {sortedStocks.length === 0 && (
          <div className="px-6 py-10 text-center text-text-muted italic text-sm">
            今日尚無符合此策略的選股結果。
          </div>
        )}
        {sortedStocks.map((stock, i) => {
          const extraFields = getExtraFields(stock)
          const isExpanded = expandedSymbol === stock.symbol
          const indicator = indicatorMap.get(stock.symbol) ?? null

          return (
            <div key={`${stock.symbol}-${i}`}>
              {/* Main row */}
              <div
                onClick={() => definition && toggleExpand(stock.symbol)}
                className={`grid grid-cols-2 sm:grid-cols-[2fr_1.5fr_1fr_1.5fr_32px] gap-2 px-4 py-3 hover:bg-blue-50/40 transition-colors items-center ${definition ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-blue-50/30' : ''}`}
              >
                {/* Col 1: Name (big) / Symbol (small, gray) */}
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-text-primary leading-tight">{stock.name ?? '--'}</span>
                  <span className="text-xs font-mono text-text-muted">{stock.symbol}</span>
                </div>

                {/* Col 2: Price (big) / Change% (small) */}
                <div className="flex flex-col items-end sm:items-start">
                  <span className="text-base font-mono font-semibold text-text-primary leading-tight">
                    {stock.price != null ? stock.price.toFixed(2) : '--'}
                  </span>
                  <span className={`text-xs font-mono ${stock.change_pct == null ? 'text-text-muted' : stock.change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change_pct != null ? `${stock.change_pct >= 0 ? '+' : ''}${stock.change_pct.toFixed(2)}%` : '--'}
                  </span>
                </div>

                {/* Col 3: Volume (億) */}
                <div className="flex items-center">
                  <span className="text-sm font-mono text-text-primary">
                    {extraFields.volume != null ? extraFields.volume.toFixed(2) : '--'}
                  </span>
                </div>

                {/* Col 4: Monthly Revenue Growth (big, colored) / Cumulative Revenue Growth (small) */}
                <div className="flex flex-col items-end sm:items-start">
                  <span className={`text-base font-mono font-semibold leading-tight ${extraFields.monthly != null ? (extraFields.monthly >= 0 ? 'text-green-600' : 'text-red-600') : 'text-text-muted'}`}>
                    {extraFields.monthly != null ? `${extraFields.monthly >= 0 ? '+' : ''}${extraFields.monthly.toFixed(1)}%` : '--'}
                  </span>
                  <span className={`text-xs font-mono ${extraFields.cumulative != null ? (extraFields.cumulative >= 0 ? 'text-green-600' : 'text-red-600') : 'text-text-muted'}`}>
                    {extraFields.cumulative != null ? `累計 ${extraFields.cumulative >= 0 ? '+' : ''}${extraFields.cumulative.toFixed(1)}%` : ''}
                  </span>
                </div>

                {/* Col 5: Expand indicator */}
                {definition && (
                  <div className="hidden sm:flex items-center justify-center text-text-muted">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                )}
              </div>

              {/* Expanded indicator row */}
              {isExpanded && definition && (
                <table className="w-full"><tbody>
                  <ExpandedIndicatorRow
                    indicator={indicator}
                    definition={definition}
                    colSpan={COL_SPAN}
                    windCode={windCode}
                  />
                </tbody></table>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main StrategyPanel ────────────────────────
export default function StrategyPanel({ stocks, category, strategyDefinitions, windCode = 'none' }: StrategyPanelProps) {
  const config = CATEGORY_CONFIG[category]
  const [activeStrategyIdx, setActiveStrategyIdx] = useState(0)
  const [indicatorData, setIndicatorData] = useState<StockIndicator[]>([])

  const activeStrategy = config.strategies[activeStrategyIdx]
  const filteredStocks = stocks.filter((s) => s.strategy_id === activeStrategy.id)

  // Find the strategy definition for the active strategy
  const activeDefinition = strategyDefinitions.find((d) => d.id === activeStrategy.id) ?? null

  // Fetch indicator data for all stocks in this strategy
  const fetchIndicators = useCallback(async (strategyId: string) => {
    try {
      const res = await fetch(`/api/kite-indicators?strategy_id=${encodeURIComponent(strategyId)}`)
      if (res.ok) {
        const json = await res.json()
        setIndicatorData(json.data ?? [])
      }
    } catch {
      setIndicatorData([])
    }
  }, [])

  useEffect(() => {
    fetchIndicators(activeStrategy.id)
  }, [activeStrategy.id, fetchIndicators])

  return (
    <div className="flex gap-4 items-start">
      {/* Main content */}
      <div className="flex-1 bg-white rounded-md border border-border shadow-sm overflow-hidden min-w-0">
        <div className="p-4 border-b border-border bg-surface-raised flex justify-between items-center">
          <h3 className="font-display text-primary tracking-wide">{config.title}</h3>
          <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
            共 {stocks.length} 檔
          </span>
        </div>

        {/* Sub-strategy Tabs */}
        <div className="border-b border-border">
          <div className="flex">
            {config.strategies.map((strategy, idx) => {
              const count = stocks.filter((s) => s.strategy_id === strategy.id).length
              return (
                <button
                  key={strategy.id}
                  onClick={() => setActiveStrategyIdx(idx)}
                  className={`px-6 py-3 text-sm font-sans transition-all border-b-2 ${activeStrategyIdx === idx
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-text-muted hover:text-text-primary hover:border-gray-300'
                    }`}
                >
                  {strategy.label}
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeStrategyIdx === idx ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Stock table with expandable indicator rows */}
        <StockTable
          stocks={filteredStocks}
          category={category}
          indicatorData={indicatorData}
          definition={activeDefinition}
          windCode={windCode}
        />
      </div>

      {/* Always-visible strategy sidebar */}
      <FloatingStrategyPanel definition={activeDefinition} />
    </div>
  )
}
