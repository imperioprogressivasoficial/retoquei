export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-48 bg-white/5 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <div className="h-3 w-24 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-9 w-16 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <div className="h-4 w-48 bg-white/5 rounded animate-pulse mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 mb-3">
            <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
            <div className="flex-1 h-2 bg-white/5 rounded-full animate-pulse" />
            <div className="h-3 w-8 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
