'use client'

import { useState } from 'react';
import { AlertTriangle, ShieldAlert, ScrollText, Upload, X } from 'lucide-react';
import type { PortfolioPosition } from '@/lib/nexus-backend';

interface PortfolioPanelProps {
  positions: PortfolioPosition[];
}

function ImportModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-white rounded-md border border-border shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="font-display text-primary">匯入交易紀錄</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-center text-text-muted">
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">交易匯入功能開發中，敬請期待。</p>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPanel({ positions }: PortfolioPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-raised flex justify-between items-center">
        <h3 className="font-display text-primary tracking-wide flex items-center gap-2">
          <ScrollText className="w-5 h-5" />
          庫存管理
        </h3>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
            <span>技術轉弱</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span>動能衰退</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans bg-primary text-white rounded hover:bg-opacity-90 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            匯入交易
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background text-text-secondary text-xs tracking-wider font-sans">
              <th className="px-6 py-3 border-b border-border font-semibold">代號</th>
              <th className="px-6 py-3 border-b border-border font-semibold">名稱</th>
              <th className="px-6 py-3 border-b border-border font-semibold">持股數</th>
              <th className="px-6 py-3 border-b border-border font-semibold">平均成本</th>
              <th className="px-6 py-3 border-b border-border font-semibold">現價</th>
              <th className="px-6 py-3 border-b border-border font-semibold text-right">損益</th>
              <th className="px-6 py-3 border-b border-border font-semibold text-center">警示</th>
            </tr>
          </thead>
          <tbody className="text-sm font-sans divide-y divide-border">
            {positions.map((pos, i) => {
              const pnl = (pos.current_price - pos.cost_basis) * pos.shares;
              const pnlPercent = pos.cost_basis > 0 ? ((pos.current_price / pos.cost_basis - 1) * 100).toFixed(2) : '0.00';

              return (
                <tr key={`${pos.symbol}-${i}`} className={`hover:bg-background transition-colors ${pos.momentum_alert ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4 font-mono text-text-primary">{pos.symbol}</td>
                  <td className="px-6 py-4 font-semibold text-text-primary">{pos.name}</td>
                  <td className="px-6 py-4">{pos.shares}</td>
                  <td className="px-6 py-4 font-mono">{pos.cost_basis?.toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono">{pos.current_price?.toFixed(2)}</td>
                  <td className={`px-6 py-4 text-right font-mono font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()} ({pnlPercent}%)
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {pos.momentum_alert && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs border border-yellow-200">
                          <AlertTriangle className="w-3 h-3" />
                          技術轉弱
                        </span>
                      )}
                      {parseFloat(pnlPercent) < -5 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs border border-red-200">
                          <ShieldAlert className="w-3 h-3" />
                          動能衰退
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {positions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-text-muted italic">
                  目前無持倉部位。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-background border-t border-border text-xs text-text-muted">
        <strong>提示：</strong>「技術轉弱」警示表示該股票今日未出現在任何選股策略清單中，動量可能正在消退。
      </div>

      {isModalOpen && <ImportModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
