export default function SalonLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-40 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-48 bg-white/5 rounded animate-pulse mt-2" />
      </div>
      <div className="flex gap-4 mb-6">
        <div className="h-9 w-20 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-9 w-20 bg-white/5 rounded-lg animate-pulse" />
      </div>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
            <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
