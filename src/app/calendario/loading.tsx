export default function CalendarioLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-36 bg-card rounded" />
      <div className="h-24 bg-card rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-card rounded-xl" />
        ))}
      </div>
    </div>
  )
}
