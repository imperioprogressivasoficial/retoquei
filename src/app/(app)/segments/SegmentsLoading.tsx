import { Skeleton } from '@/components/ui/Skeleton'

export function SegmentsLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Cards/List skeleton */}
      <div className="grid gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-3 w-60" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-4 pt-3 border-t border-white/[0.08]">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
