'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, Check, X } from 'lucide-react'
import type { StockIndicator, StrategyDefinition, StrategyCondition } from '@/lib/nexus-backend'

interface IndicatorTableProps {
  stocks: StockIndicator[]
  definition: StrategyDefinition
}

// Human-readable labels for indicator fields
const INDICATOR_LABELS: Record<string, string> = {
  macd_dif: 'MACD',
  macd_macd: 'Signal',
  macd_histogram: 'Histogram',
  ma5: '5MA',
  ma20: '20MA',
  ma60: '60MA',
  yesterday_close: '昨日收盤價',
  close: '收盤',
}

// Get a numeric value from a stock indicator by field name
function getFieldValue(stock: StockIndicator, field: string): number | null {
  if (field === 'close') return stock.price
  if (field === 'yesterday_close') return stock.yesterday_close
  const val = (stock as unknown as Record<string, unknown>)[field]
  return typeof val === 'number' ? val : null
}

// Evaluate a single condition against a stock
function evaluateCondition(cond: StrategyCondition, stock: StockIndicator): boolean | null {
  const leftVal = getFieldValue(stock, cond.left_field)
  if (leftVal === null) return null

  let rightVal: number | null
  if (cond.right_value !== undefined && cond.right_value !== null) {
    rightVal = cond.right_value
  } else if (cond.right_field) {
    rightVal = getFieldValue(stock, cond.right_field)
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

// Check if all conditions are met for a stock
function evaluateAllConditions(conditions: StrategyCondition[], stock: StockIndicator): boolean | null {
  const results = conditions.map((c) => evaluateCondition(c, stock))
  if (results.some((r) => r === null)) return null
  return results.every((r) => r === true)
}

// Format a number to at least 2 decimal places, or return '-'
function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined) return '-'
  return val.toFixed(2)
}

type SortConfig = { key: string; direction: 'asc' | 'desc' }

export default function IndicatorTable({ stocks, definition }: IndicatorTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'symbol', direction: 'asc' })

  // Determine which indicator columns to show based on strategy conditions
  const indicatorColumns = useMemo(() => {
    const cols = new Set<string>()
    for (const cond of definition.conditions) {
      for (const ind of cond.indicators) {
        cols.add(ind)
      }
    }
    return Array.from(cols)
  }, [definition])

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      const key = sortConfig.key
      let aVal: number | string | null
      let bVal: number | string | null

      if (key === 'symbol') {
        aVal = a.symbol
        bVal = b.symbol
      } else if (key === 'all_match') {
        aVal = evaluateAllConditions(definition.conditions, a) ? 1 : 0
        bVal = evaluateAllConditions(definition.conditions, b) ? 1 : 0
      } else {
        aVal = getFieldValue(a, key)
        bVal = getFieldValue(b, key)
      }

      if (aVal === null && bVal === null) return 0
      if (aVal === null) return 1
      if (bVal === null) return -1
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [stocks, sortConfig, definition])

  const SortIndicator = ({ sortKey }: { sortKey: string }) => (
    <span className="inline-flex items-center gap-0.5">
      <ArrowUpDown className="w-3 h-3" />
      {sortConfig.key === sortKey && (
        <span className="text-primary text-[10px]">{sortConfig.direction === 'desc' ? '▼' : '▲'}</span>
      )}
    </span>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-background text-text-secondary text-xs tracking-wider font-sans border-b border-border">
            <th
              className="px-3 py-3 text-left font-semibold cursor-pointer"
              onClick={() => handleSort('symbol')}
            >
              <span className="flex items-center gap-1">股票 <SortIndicator sortKey="symbol" /></span>
            </th>
            <th
              className="px-3 py-3 text-right font-semibold cursor-pointer"
              onClick={() => handleSort('price')}
            >
              <span className="flex items-center gap-1 justify-end">股價 <SortIndicator sortKey="price" /></span>
            </th>
            {indicatorColumns.map((col) => (
              <th
                key={col}
                className="px-3 py-3 text-right font-semibold cursor-pointer"
                onClick={() => handleSort(col)}
              >
                <span className="flex items-center gap-1 justify-end">
                  {INDICATOR_LABELS[col] || col} <SortIndicator sortKey={col} />
                </span>
              </th>
            ))}
            {/* Condition match columns */}
            {definition.conditions.map((cond, idx) => (
              <th key={`cond-${idx}`} className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                {cond.label}
              </th>
            ))}
            {/* Overall match column */}
            <th
              className="px-3 py-3 text-center font-semibold cursor-pointer"
              onClick={() => handleSort('all_match')}
            >
              <span className="flex items-center gap-1 justify-center">
                符合 <SortIndicator sortKey="all_match" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedStocks.length === 0 && (
            <tr>
              <td
                colSpan={3 + indicatorColumns.length + definition.conditions.length + 1}
                className="px-6 py-10 text-center text-text-muted italic"
              >
                今日尚無符合此策略的選股結果。
              </td>
            </tr>
          )}
          {sortedStocks.map((stock) => {
            const allMatch = evaluateAllConditions(definition.conditions, stock)
            return (
              <tr
                key={stock.symbol}
                className={`hover:bg-background transition-colors ${allMatch === true ? 'bg-green-50/30' : ''}`}
              >
                {/* Stock name/symbol */}
                <td className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-text-primary leading-tight">
                      {stock.name ?? '--'}
                    </span>
                    <span className="text-xs font-mono text-text-muted">{stock.symbol}</span>
                  </div>
                </td>

                {/* Price + change */}
                <td className="px-3 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-base font-mono font-semibold text-text-primary leading-tight">
                      {fmt(stock.price)}
                    </span>
                    <span
                      className={`text-xs font-mono ${(stock.change_pct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {stock.change_pct != null
                        ? `${stock.change_pct >= 0 ? '+' : ''}${stock.change_pct.toFixed(2)}%`
                        : '--'}
                    </span>
                  </div>
                </td>

                {/* Indicator value columns */}
                {indicatorColumns.map((col) => {
                  const val = getFieldValue(stock, col)
                  return (
                    <td key={col} className="px-3 py-3 text-right font-mono text-sm">
                      {fmt(val)}
                    </td>
                  )
                })}

                {/* Condition match columns */}
                {definition.conditions.map((cond, idx) => {
                  const result = evaluateCondition(cond, stock)
                  return (
                    <td key={`cond-${idx}`} className="px-3 py-3 text-center">
                      {result === null ? (
                        <span className="text-text-muted">-</span>
                      ) : result ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700">
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                  )
                })}

                {/* Overall match */}
                <td className="px-3 py-3 text-center">
                  {allMatch === null ? (
                    <span className="text-text-muted text-xs">-</span>
                  ) : allMatch ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      <Check className="w-3 h-3" /> 符合
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      <X className="w-3 h-3" /> 不符合
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
