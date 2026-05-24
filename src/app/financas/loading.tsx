export default function FinancasLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-36 bg-card rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-card rounded-2xl" />
        ))}
      </div>
      <div className="h-72 bg-card rounded-2xl" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-card rounded-xl" />
        ))}
      </div>
    </div>
  )
}
