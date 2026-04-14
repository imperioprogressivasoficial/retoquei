export default function AutomationsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-44 bg-white/5 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-40 bg-white/5 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-3 w-56 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-5 w-14 bg-white/5 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
