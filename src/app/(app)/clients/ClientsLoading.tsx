import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton'

export function ClientsLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="hidden md:block">
        <TableSkeleton />
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}
