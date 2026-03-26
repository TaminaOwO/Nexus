'use client'

import { TrendingUp, TrendingDown, Minus, BarChart3, Activity } from 'lucide-react';
import type { MarketIndex, StrategyStat } from '@/lib/nexus-backend';

interface MarketPanelProps {
  indices: MarketIndex[];
  futures: MarketIndex | null;
  stats: StrategyStat[];
}

const STRATEGY_LABELS: Record<string, string> = {
  'boss_cheap': '老闆型-低廉股',
  'boss_pullback': '老闆型-拉回股',
  'office_strong': '上班族型-強勢股',
  'office_trend': '上班族型-趨勢股',
  'worker_strong': '打工型-強勢日',
  'worker_pullback': '打工型-日拉回',
};

export default function MarketPanel({ indices, futures, stats }: MarketPanelProps) {
  const renderArrow = (diff: number) => {
    if (diff > 0) return <TrendingUp className="w-5 h-5 text-secondary" />;
    if (diff < 0) return <TrendingDown className="w-5 h-5 text-error" />;
    return <Minus className="w-5 h-5 text-text-muted" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 大盤指數與期貨 */}
      <section className="bg-white p-6 rounded-md border border-border shadow-sm">
        <h3 className="text-lg font-display text-primary mb-4 border-b border-border pb-2 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          大盤指數
        </h3>
        <div className="space-y-4">
          {indices.map((idx) => (
            <div key={idx.symbol} className="flex justify-between items-center bg-background p-3 rounded-sm">
              <div>
                <div className="font-sans font-semibold text-text-primary">{idx.name || idx.symbol}</div>
                <div className="text-xs text-text-muted font-mono">{idx.symbol}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-display">{idx.price?.toLocaleString() ?? '--'}</div>
                <div className={`text-xs font-sans ${(idx.change ?? 0) >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {(idx.change ?? 0) >= 0 ? '+' : ''}{idx.change ?? 0} ({idx.change_pct ?? 0}%)
                </div>
              </div>
            </div>
          ))}

          {futures && (
            <div className="flex justify-between items-center bg-secondary bg-opacity-5 p-3 rounded-sm border-l-4 border-secondary">
              <div>
                <div className="font-sans font-semibold text-text-primary">台指期</div>
                <div className="text-xs text-text-muted font-mono">TXF1</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-display">{futures.price?.toLocaleString() ?? '--'}</div>
                <div className={`text-xs font-sans ${(futures.change ?? 0) >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {(futures.change ?? 0) >= 0 ? '+' : ''}{futures.change ?? 0} ({futures.change_pct ?? 0}%)
                </div>
              </div>
            </div>
          )}

          {indices.length === 0 && !futures && (
            <div className="text-center text-text-muted py-10 italic">尚無大盤資料，請確認後端排程是否已執行。</div>
          )}
        </div>
      </section>

      {/* 市場寬度 */}
      <section className="bg-white p-6 rounded-md border border-border shadow-sm">
        <h3 className="text-lg font-display text-primary mb-4 border-b border-border pb-2 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          市場寬度
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.strategy_id} className="p-4 bg-background rounded-sm border border-border flex justify-between items-center">
              <div>
                <div className="text-xs text-text-muted font-sans">{STRATEGY_LABELS[s.strategy_id] || s.strategy_id}</div>
                <div className="text-xl font-display mt-1">
                  {s.today} <span className="text-xs text-text-muted">檔</span>
                </div>
              </div>
              <div>
                {renderArrow(s.diff)}
              </div>
            </div>
          ))}
          {stats.length === 0 && (
            <div className="col-span-2 text-center text-text-muted py-10 italic">今日尚無市場寬度資料。</div>
          )}
        </div>
        <div className="mt-6 p-3 bg-surface-raised rounded-xs text-xs text-text-secondary leading-relaxed">
          <strong>市場寬度說明：</strong>各策略選股家數的日增減。多頭排列家數增加表示市場結構轉強；反之則轉弱。
        </div>
      </section>
    </div>
  );
}
