function SkeletonCard() {
  return (
    <div data-testid="skeleton-card" className="bg-white border border-border rounded-md p-4 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 bg-surface-raised rounded w-3/4" />
        <div className="h-4 bg-surface-raised rounded w-16" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 bg-surface-raised rounded w-14" />
        <div className="h-5 bg-surface-raised rounded w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-surface-raised rounded w-full" />
        <div className="h-3 bg-surface-raised rounded w-5/6" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-4 bg-surface-raised rounded w-12" />
        <div className="h-4 bg-surface-raised rounded w-16" />
      </div>
    </div>
  )
}

export default function CatLabSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Published column */}
      <div className="space-y-4">
        <h3 className="font-display text-lg text-text-primary">Published</h3>
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Drafts column */}
      <div className="space-y-4">
        <h3 className="font-display text-lg text-text-primary">Drafts</h3>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
