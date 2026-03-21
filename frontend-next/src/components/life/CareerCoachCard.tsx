export default function CareerCoachCard() {
  return (
    <div className="bg-white border border-border rounded-md p-4">
      <span className="text-xs opacity-40 font-mono">
        [MOCK - Phase 1.2 will connect Firestore]
      </span>

      <h3 className="font-display text-lg text-text-primary mt-3 mb-2">
        Career Coach
      </h3>

      <p className="text-sm text-text-secondary mb-1">
        Current Phase
      </p>
      <p className="font-mono text-base text-primary mb-3">
        Phase 2 — 空大報名中
      </p>

      <div className="mb-2">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Progress</span>
          <span className="font-mono">40%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-raised rounded-none overflow-hidden">
          <div
            className="h-full bg-primary rounded-none"
            style={{ width: '40%' }}
          />
        </div>
      </div>

      <p className="text-sm text-text-secondary mt-3">
        Next Action
      </p>
      <p className="text-sm text-text-primary">
        完成空大選課系統註冊，確認 113-2 學期課程
      </p>
    </div>
  )
}
