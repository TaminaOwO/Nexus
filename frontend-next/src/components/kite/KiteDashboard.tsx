'use client'

import { useState } from 'react';
import { Wind, TrendingUp, Briefcase, HardHat, Wallet, BarChart3 } from 'lucide-react';
import MarketPanel from './MarketPanel';
import StrategyPanel from './StrategyPanel';
import PortfolioPanel from './PortfolioPanel';
import type { MarketIndex, StrategyStock, StrategyStat, PortfolioPosition } from '@/lib/nexus-backend';

const TABS = [
  { id: 'market', label: '大盤儀表板', icon: BarChart3 },
  { id: 'boss', label: '老闆型', icon: Briefcase },
  { id: 'office', label: '上班族型', icon: TrendingUp },
  { id: 'worker', label: '打工型', icon: HardHat },
  { id: 'portfolio', label: '庫存管理', icon: Wallet },
];

interface KiteDashboardProps {
  indices: MarketIndex[];
  futures: MarketIndex | null;
  stats: StrategyStat[];
  officeStocks: StrategyStock[];
  workerStocks: StrategyStock[];
  bossStocks: StrategyStock[];
  portfolio: PortfolioPosition[];
}

// Wind status mapping: backend stores wind code as number in WIND symbol's price field
// { 1: "陣風", 2: "強風", 3: "無風", 4: "亂流" }
const WIND_CODE_MAP: Record<number, string> = {
  1: 'gust',
  2: 'strong',
  3: 'none',
  4: 'turbulence',
};

const WIND_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  strong:     { label: '強風：今日市場強勢，適合積極佈局', color: 'text-green-700', bgColor: 'bg-green-50' },
  gust:       { label: '陣風：市場動能局部增強，關注盤中機會', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  none:       { label: '無風：市場觀望氣氛濃厚，宜保守操作', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  turbulence: { label: '亂流：市場波動加劇，注意風險控管', color: 'text-red-700', bgColor: 'bg-red-50' },
};

export default function KiteDashboard(props: KiteDashboardProps) {
  const [activeTab, setActiveTab] = useState('market');

  // Extract wind status from indices (stored as WIND symbol in market_index_cache)
  const windEntry = props.indices.find((idx) => idx.symbol === 'WIND');
  const windNumericCode = windEntry ? Math.round(windEntry.price) : 3;
  const windCode = WIND_CODE_MAP[windNumericCode] || 'none';
  const wind = WIND_MAP[windCode] || WIND_MAP['none'];

  // Filter out WIND from display indices — it's metadata, not a market index
  const displayIndices = props.indices.filter((idx) => idx.symbol !== 'WIND');

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 bg-white p-4 rounded-md border border-border shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-display text-primary flex items-center gap-2">
              <Wind className="w-5 h-5" />
              Kite 智能選股儀表板
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Tamina 策略指揮中心
            </p>
          </div>
        </div>

        {/* 風度警語 */}
        <div className={`px-3 py-2 rounded-sm text-sm font-sans ${wind.bgColor} ${wind.color}`}>
          <Wind className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          {wind.label}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-sm font-sans transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-muted hover:bg-surface-overlay'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-h-[600px]">
        {activeTab === 'market' && <MarketPanel indices={displayIndices} futures={props.futures} stats={props.stats} />}
        {activeTab === 'boss' && <StrategyPanel stocks={props.bossStocks} category="boss" />}
        {activeTab === 'office' && <StrategyPanel stocks={props.officeStocks} category="office" />}
        {activeTab === 'worker' && <StrategyPanel stocks={props.workerStocks} category="worker" />}
        {activeTab === 'portfolio' && <PortfolioPanel positions={props.portfolio} />}
      </div>
    </div>
  );
}
