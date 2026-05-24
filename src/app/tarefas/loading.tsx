export default function TarefasLoading() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-32 bg-card rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-80 bg-card rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
