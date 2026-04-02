'use client'

import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, AlertTriangle } from 'lucide-react';
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

  const renderIndexCard = (idx: MarketIndex, isFutures = false) => {
    const isError = idx.fetch_status === 'error';
    const baseBg = isFutures ? 'bg-secondary bg-opacity-5' : 'bg-background';
    const borderClass = isFutures ? 'border-l-4 border-secondary' : '';
    const errorClass = isError ? 'border border-amber-200 bg-amber-50/40' : '';

    return (
      <div
        key={idx.symbol}
        className={`flex justify-between items-center p-3 rounded-sm ${isError ? errorClass : `${baseBg} ${borderClass}`}`}
      >
        <div>
          <div className="font-sans font-semibold text-text-primary flex items-center gap-1.5">
            {isError && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            {isFutures ? '台指期' : (idx.name || idx.symbol)}
          </div>
          <div className="text-xs text-text-muted font-mono flex items-center gap-1.5">
            {idx.symbol}
            {isError && <span className="text-[10px] text-amber-600 font-sans">上次成功數據</span>}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-display ${isError ? 'opacity-50' : ''}`}>
            {idx.price?.toLocaleString() ?? '--'}
          </div>
          <div className={`text-xs font-sans ${isError ? 'opacity-50' : ''} ${(idx.change ?? 0) >= 0 ? 'text-secondary' : 'text-error'}`}>
            {(idx.change ?? 0) >= 0 ? '+' : ''}{idx.change ?? 0} ({idx.change_pct ?? 0}%)
          </div>
        </div>
      </div>
    );
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
          {indices.map((idx) => renderIndexCard(idx))}
          {futures && renderIndexCard(futures, true)}

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
