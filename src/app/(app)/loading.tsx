export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-8 w-40 bg-white/5 rounded" />
        <div className="h-4 w-56 bg-white/5 rounded mt-2" />
      </div>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 w-1/4 bg-white/5 rounded" />
            <div className="h-4 w-1/3 bg-white/5 rounded" />
            <div className="h-4 w-1/5 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
