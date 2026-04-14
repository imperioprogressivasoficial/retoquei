export default function IntegrationsLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-52 bg-white/5 rounded animate-pulse mt-2" />
      </div>
      <div className="grid gap-6">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-white/5 rounded-2xl animate-pulse" />
            <div className="flex-1">
              <div className="h-6 w-28 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-white/5 rounded animate-pulse mb-1" />
              <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-20 bg-white/5 rounded animate-pulse mb-2" />
                  <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
