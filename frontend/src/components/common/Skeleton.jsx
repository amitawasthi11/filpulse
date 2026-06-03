// src/components/common/Skeleton.jsx
export const SkeletonCard = () => (
  <div className="glass rounded-xl p-5 space-y-3">
    <div className="skeleton h-3 w-24 rounded" />
    <div className="skeleton h-7 w-32 rounded" />
    <div className="skeleton h-2 w-20 rounded" />
  </div>
)

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton h-12 rounded-lg" />
    ))}
  </div>
)

export const SkeletonText = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`skeleton h-3 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
)

export const SkeletonNewsCard = () => (
  <div className="glass rounded-xl p-5 space-y-3">
    <div className="flex gap-3">
      <div className="skeleton w-20 h-16 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="skeleton h-2 w-24 rounded" />
      </div>
    </div>
    <div className="skeleton h-2 w-20 rounded" />
  </div>
)
