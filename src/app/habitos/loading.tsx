export default function HabitosLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-40 bg-card rounded" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-card rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
