'use client'

import { useState } from 'react';
import { ArrowUpDown, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { StrategyStock } from '@/lib/nexus-backend';

interface StrategyPanelProps {
  stocks: StrategyStock[];
  category: 'boss' | 'office' | 'worker';
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
} as const;

// Known condition boolean fields in extra_json
const CONDITION_KEYS = [
  { key: 'isOscGrowing', label: 'OSC 成長' },
  { key: 'isVolumeBreakout', label: '量能突破' },
  { key: 'isMACDGolden', label: 'MACD 黃金交叉' },
  { key: 'isTrendUp', label: '趨勢向上' },
];

function StockTable({
  stocks,
  getScreenerLabel,
}: {
  stocks: StrategyStock[];
  getScreenerLabel: (id: string) => string;
}) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = (a as unknown as Record<string, unknown>)[key];
    const bVal = (b as unknown as Record<string, unknown>)[key];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleExpand = (symbol: string) => {
    setExpandedSymbol(expandedSymbol === symbol ? null : symbol);
  };

  // Extract conditions from extra_json
  const getConditions = (stock: StrategyStock) => {
    if (!stock.extra_json) return [];
    return CONDITION_KEYS.map(({ key, label }) => {
      const value = stock.extra_json?.[key];
      if (value === undefined) return null;
      return { label, value: Boolean(value) };
    }).filter(Boolean) as { label: string; value: boolean }[];
  };

  // Extract revenue fields from extra_json
  const getRevenue = (stock: StrategyStock) => {
    const monthly = stock.extra_json?.monthly_revenue_growth;
    const cumulative = stock.extra_json?.cumulative_revenue_growth;
    return {
      monthly: typeof monthly === 'number' ? monthly : null,
      cumulative: typeof cumulative === 'number' ? cumulative : null,
    };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-background text-text-secondary text-xs tracking-wider font-sans">
            <th className="px-4 py-3 border-b border-border font-semibold w-8"></th>
            <th className="px-4 py-3 border-b border-border font-semibold cursor-pointer" onClick={() => handleSort('symbol')}>
              <span className="flex items-center gap-1">代號 <ArrowUpDown className="w-3 h-3" /></span>
            </th>
            <th className="px-4 py-3 border-b border-border font-semibold cursor-pointer" onClick={() => handleSort('name')}>
              <span className="flex items-center gap-1">名稱 <ArrowUpDown className="w-3 h-3" /></span>
            </th>
            <th className="px-4 py-3 border-b border-border font-semibold cursor-pointer" onClick={() => handleSort('price')}>
              <span className="flex items-center gap-1">股價 <ArrowUpDown className="w-3 h-3" /></span>
            </th>
            <th className="px-4 py-3 border-b border-border font-semibold cursor-pointer" onClick={() => handleSort('change')}>
              <span className="flex items-center gap-1">漲跌 <ArrowUpDown className="w-3 h-3" /></span>
            </th>
            <th className="px-4 py-3 border-b border-border font-semibold cursor-pointer" onClick={() => handleSort('change_pct')}>
              <span className="flex items-center gap-1">漲跌% <ArrowUpDown className="w-3 h-3" /></span>
            </th>
            <th className="px-4 py-3 border-b border-border font-semibold">單月營收成長</th>
            <th className="px-4 py-3 border-b border-border font-semibold">累計營收成長</th>
            <th className="px-4 py-3 border-b border-border font-semibold">策略</th>
            <th className="px-4 py-3 border-b border-border font-semibold">條件檢核</th>
          </tr>
        </thead>
        <tbody className="text-sm font-sans divide-y divide-border">
          {sortedStocks.map((stock, i) => {
            const conditions = getConditions(stock);
            const revenue = getRevenue(stock);
            const isExpanded = expandedSymbol === stock.symbol;

            return (
              <StrategyStockRow
                key={`${stock.symbol}-${i}`}
                stock={stock}
                conditions={conditions}
                revenue={revenue}
                isExpanded={isExpanded}
                onToggle={() => toggleExpand(stock.symbol)}
                getScreenerLabel={getScreenerLabel}
              />
            );
          })}
          {stocks.length === 0 && (
            <tr>
              <td colSpan={10} className="px-6 py-10 text-center text-text-muted italic">
                今日尚無符合此策略的選股結果。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StrategyStockRow({
  stock,
  conditions,
  revenue,
  isExpanded,
  onToggle,
  getScreenerLabel,
}: {
  stock: StrategyStock;
  conditions: { label: string; value: boolean }[];
  revenue: { monthly: number | null; cumulative: number | null };
  isExpanded: boolean;
  onToggle: () => void;
  getScreenerLabel: (id: string) => string;
}) {
  return (
    <>
      <tr
        className="hover:bg-background transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-4 text-text-muted">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
        <td className="px-4 py-4 font-mono text-text-primary">{stock.symbol}</td>
        <td className="px-4 py-4 font-semibold text-text-primary">{stock.name ?? '--'}</td>
        <td className="px-4 py-4 font-mono">{stock.price != null ? stock.price.toFixed(2) : '--'}</td>
        <td className={`px-4 py-4 font-mono font-semibold ${(stock.change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {stock.change != null ? `${stock.change >= 0 ? '+' : ''}${stock.change}` : '--'}
        </td>
        <td className={`px-4 py-4 font-mono font-semibold ${(stock.change_pct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {stock.change_pct != null ? `${stock.change_pct >= 0 ? '+' : ''}${stock.change_pct}%` : '--'}
        </td>
        <td className={`px-4 py-4 font-mono ${revenue.monthly != null ? (revenue.monthly >= 0 ? 'text-green-600' : 'text-red-600') : 'text-text-muted'}`}>
          {revenue.monthly != null ? `${revenue.monthly >= 0 ? '+' : ''}${revenue.monthly.toFixed(1)}%` : '--'}
        </td>
        <td className={`px-4 py-4 font-mono ${revenue.cumulative != null ? (revenue.cumulative >= 0 ? 'text-green-600' : 'text-red-600') : 'text-text-muted'}`}>
          {revenue.cumulative != null ? `${revenue.cumulative >= 0 ? '+' : ''}${revenue.cumulative.toFixed(1)}%` : '--'}
        </td>
        <td className="px-4 py-4">
          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">
            {getScreenerLabel(stock.strategy_id)}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex gap-1.5">
            {conditions.length > 0 ? (
              conditions.map((c) => (
                <span key={c.label} title={c.label}>
                  {c.value ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </span>
              ))
            ) : (
              <span className="text-text-muted text-xs">--</span>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={10} className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-text-muted text-xs block">代號</span>
                <span className="font-mono font-semibold">{stock.symbol}</span>
              </div>
              <div>
                <span className="text-text-muted text-xs block">名稱</span>
                <span className="font-semibold">{stock.name ?? '--'}</span>
              </div>
              <div>
                <span className="text-text-muted text-xs block">股價</span>
                <span className="font-mono">{stock.price != null ? stock.price.toFixed(2) : '--'}</span>
              </div>
              <div>
                <span className="text-text-muted text-xs block">漲跌</span>
                <span className={`font-mono ${(stock.change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.change != null ? `${stock.change >= 0 ? '+' : ''}${stock.change} (${stock.change_pct ?? '--'}%)` : '--'}
                </span>
              </div>
              <div>
                <span className="text-text-muted text-xs block">策略分類</span>
                <span>{getScreenerLabel(stock.strategy_id)}</span>
              </div>
              <div>
                <span className="text-text-muted text-xs block">取得日期</span>
                <span className="font-mono text-xs">{stock.fetched_date}</span>
              </div>
              {conditions.length > 0 && (
                <div className="col-span-2">
                  <span className="text-text-muted text-xs block mb-1">條件檢核詳情</span>
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((c) => (
                      <span
                        key={c.label}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${c.value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                          }`}
                      >
                        {c.value ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function StrategyPanel({ stocks, category }: StrategyPanelProps) {
  const config = CATEGORY_CONFIG[category];
  const [activeStrategyIdx, setActiveStrategyIdx] = useState(0);

  const activeStrategy = config.strategies[activeStrategyIdx];
  const filteredStocks = stocks.filter((s) => s.strategy_id === activeStrategy.id);

  const getScreenerLabel = (id: string) => {
    const found = config.strategies.find((s) => s.id === id);
    return found ? found.label : id;
  };

  return (
    <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
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
            const count = stocks.filter((s) => s.strategy_id === strategy.id).length;
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
            );
          })}
        </div>
      </div>

      <StockTable stocks={filteredStocks} getScreenerLabel={getScreenerLabel} />
    </div>
  );
}
