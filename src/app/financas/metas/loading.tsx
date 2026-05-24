export default function MetasLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-44 bg-card rounded" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
