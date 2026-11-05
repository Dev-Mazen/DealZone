export default function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`skeleton rounded-lg ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[rgba(6,36,91,0.06)] p-6 space-y-3">
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} width="40%" />
      <div className="space-y-2 pt-2">
        <Skeleton height={12} />
        <Skeleton height={12} width="80%" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-[rgba(6,36,91,0.06)]">
          <Skeleton width={40} height={40} className="rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton height={14} width="50%" />
            <Skeleton height={12} width="30%" />
          </div>
          <Skeleton width={80} height={28} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  )
}

