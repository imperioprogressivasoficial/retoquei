import { Skeleton } from '@/components/ui/Skeleton'

export function DashboardLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Top KPIs (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-5">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Middle row: lifecycle + campaigns */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Lifecycle chart */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 sm:p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 flex-1 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>

        {/* Campaigns summary */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: recent clients + actions */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent clients */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 sm:p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 sm:p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
