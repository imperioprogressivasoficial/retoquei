export default function TemplatesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-40 bg-white/5 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-36 bg-white/5 rounded-lg animate-pulse" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-4 w-20 bg-white/5 rounded animate-pulse mb-3" />
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
