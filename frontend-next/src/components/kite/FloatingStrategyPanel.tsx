'use client'

import { useState } from 'react'
import { ChevronRight, ChevronLeft, ListChecks } from 'lucide-react'
import type { StrategyDefinition } from '@/lib/nexus-backend'

// Frontend override for strategy display conditions (NEXUS-006-R1 Issue 3)
export const DISPLAY_CONDITIONS_OVERRIDE: Record<string, string[]> = {
  boss_cheap: [
    '適合風度: STRONG, TURBULENT, GUSTY, CALM（全天候）',
    '營收 YOY > 30%',
    '靠近月線或破月線（偏離 ≤ 3%）',
  ],
  boss_pullback: [
    '適合風度: STRONG, TURBULENT, GUSTY, CALM（全天候）',
    '營收 YOY > 30%',
    '靠近月線或破月線（偏離 ≤ 3%）',
  ],
  office_strong: [
    '適合風度: STRONG, GUSTY',
    '週 MACD 趨勢向上',
    '日 MACD 紅柱',
    '日 MACD 紅柱 ≤ 2 天（早期進場）',
    '循環為易漲（高勝率）',
  ],
  office_trend: [
    '適合風度: STRONG, GUSTY',
    '週 MACD 趨勢向上',
    '價格靠近 5 日均線（1.5% 內）',
  ],
}

interface FloatingStrategyPanelProps {
  definition: StrategyDefinition | null
}

export default function FloatingStrategyPanel({ definition }: FloatingStrategyPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (!definition) return null

  return (
    <div
      className={`relative shrink-0 transition-all duration-300 ${collapsed ? 'w-8' : 'w-[280px]'}`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-4 z-10 flex items-center justify-center w-6 h-12 bg-primary text-white rounded-l-md shadow-md hover:bg-primary/90 transition-colors"
        aria-label={collapsed ? '展開策略面板' : '摺疊策略面板'}
      >
        {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Panel body */}
      {!collapsed && (
        <div className="bg-white border border-border rounded-md shadow-sm overflow-hidden sticky top-4">
          {/* Header */}
          <div className="px-4 py-3 bg-surface-raised border-b border-border">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm text-primary tracking-wide truncate">
                {definition.name}
              </h3>
            </div>
          </div>

          {/* Conditions list — prefer display_conditions (precise text) over raw conditions */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-text-muted font-sans tracking-wider uppercase">
              策略條件
            </p>
            <ul className="space-y-2">
              {(DISPLAY_CONDITIONS_OVERRIDE[definition.id]
                ?? (definition.display_conditions && definition.display_conditions.length > 0
                  ? definition.display_conditions
                  : definition.conditions.map((c) => c.label))
              ).map((label, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm font-sans text-text-primary"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            {/* Required indicators */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-text-muted font-sans tracking-wider uppercase mb-2">
                使用指標
              </p>
              <div className="flex flex-wrap gap-1">
                {Array.from(
                  new Set(definition.conditions.flatMap((c) => c.indicators))
                ).map((ind) => (
                  <span
                    key={ind}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded font-mono"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
