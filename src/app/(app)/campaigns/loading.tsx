export default function CampaignsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-40 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-28 bg-white/5 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-36 bg-white/5 rounded-lg animate-pulse" />
      </div>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4 border-b border-white/[0.04]">
            <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-28 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
