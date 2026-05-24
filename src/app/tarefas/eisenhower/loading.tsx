export default function EisenhowerLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-56 bg-card rounded" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-60 bg-card rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
