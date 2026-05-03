export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-[#F0E6E0] overflow-hidden">
      <div className="h-48 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton w-3/4" />
        <div className="h-3 skeleton w-1/2" />
        <div className="flex gap-2">
          <div className="h-6 skeleton w-16 rounded-full" />
          <div className="h-6 skeleton w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#F0E6E0]">
          <div className="h-10 w-10 skeleton rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 skeleton w-2/3" />
            <div className="h-3 skeleton w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 skeleton ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}
