'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RevenueGrowthStock } from '@/lib/nexus-backend';

interface RevenueGrowthPanelProps {
  stocks: RevenueGrowthStock[];
  loading?: boolean;
  error?: string | null;
}

function formatPercent(value: number | null): string {
  if (value == null) return '-';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatVolume(value: number | null): string {
  if (value == null) return '-';
  return `${value.toFixed(2)} 億`;
}

function formatPrice(value: number): string {
  return value.toFixed(2);
}

function percentColor(value: number | null): string {
  if (value == null) return 'text-text-muted';
  if (value > 0) return 'text-red-600';
  if (value < 0) return 'text-green-600';
  return 'text-text-muted';
}

export default function RevenueGrowthPanel({ stocks, loading, error }: RevenueGrowthPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-md border border-border shadow-sm p-8">
        <div className="flex items-center justify-center gap-2 text-text-muted">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-sans">載入營收成長清單中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-md border border-border shadow-sm p-8">
        <div className="text-center text-red-600 text-sm font-sans">
          <p>載入失敗：{error}</p>
          <p className="text-text-muted mt-1">請稍後再試</p>
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="bg-white rounded-md border border-border shadow-sm p-8">
        <p className="text-center text-text-muted text-sm font-sans italic">
          目前無營收成長資料。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-raised flex justify-between items-center">
        <h3 className="font-display text-primary tracking-wide">單月營收成長選股</h3>
        <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
          共 {stocks.length} 檔
        </span>
      </div>

      <div className="overflow-x-auto">
        {/* Mobile: Card layout */}
        <div className="block md:hidden divide-y divide-border">
          {stocks.map((stock) => (
            <div key={stock.stockCode} className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-base font-semibold text-text-primary">{stock.stockName}</span>
                  <span className="ml-2 text-xs text-text-muted font-mono">{stock.stockCode}</span>
                </div>
                <div className="text-right">
                  <div className="text-base font-mono font-semibold">{formatPrice(stock.closingPrice)}</div>
                  <div className={`text-xs font-mono ${percentColor(stock.priceChangePercent)}`}>
                    {formatPercent(stock.priceChangePercent)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">成交金額</span>
                <span className="font-mono">{formatVolume(stock.tradeVolumeBillions)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">單月營收成長</span>
                <span className={`font-mono font-semibold ${percentColor(stock.monthlyRevenueGrowthPercent)}`}>
                  {formatPercent(stock.monthlyRevenueGrowthPercent)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">累計營收成長</span>
                <span className={`font-mono ${percentColor(stock.cumulativeRevenueGrowthPercent)}`}>
                  {formatPercent(stock.cumulativeRevenueGrowthPercent)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: 4-column table */}
        <table className="hidden md:table w-full text-left border-collapse">
          <thead>
            <tr className="bg-background text-text-secondary text-xs tracking-wider font-sans">
              <th className="px-4 py-3 border-b border-border font-semibold">股票</th>
              <th className="px-4 py-3 border-b border-border font-semibold text-right">收盤價 / 漲幅</th>
              <th className="px-4 py-3 border-b border-border font-semibold text-right">成交金額(億)</th>
              <th className="px-4 py-3 border-b border-border font-semibold text-right">營收成長</th>
            </tr>
          </thead>
          <tbody className="text-sm font-sans divide-y divide-border">
            {stocks.map((stock) => (
              <tr key={stock.stockCode} className="hover:bg-background transition-colors">
                {/* Column 1: Stock Name (large) / Code (small) */}
                <td className="px-4 py-4">
                  <div className="text-base font-semibold text-text-primary">{stock.stockName}</div>
                  <div className="text-xs text-text-muted font-mono">{stock.stockCode}</div>
                </td>

                {/* Column 2: Closing Price (large) / Change % (small, red up green down) */}
                <td className="px-4 py-4 text-right">
                  <div className="text-base font-mono font-semibold">{formatPrice(stock.closingPrice)}</div>
                  <div className={`text-xs font-mono ${percentColor(stock.priceChangePercent)}`}>
                    {formatPercent(stock.priceChangePercent)}
                  </div>
                </td>

                {/* Column 3: Trade Volume (billions) */}
                <td className="px-4 py-4 text-right font-mono">
                  {formatVolume(stock.tradeVolumeBillions)}
                </td>

                {/* Column 4: Monthly Revenue Growth % (large) / Cumulative % (small) */}
                <td className="px-4 py-4 text-right">
                  <div className={`text-base font-mono font-semibold ${percentColor(stock.monthlyRevenueGrowthPercent)}`}>
                    {formatPercent(stock.monthlyRevenueGrowthPercent)}
                  </div>
                  <div className={`text-xs font-mono ${percentColor(stock.cumulativeRevenueGrowthPercent)}`}>
                    累計 {formatPercent(stock.cumulativeRevenueGrowthPercent)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
