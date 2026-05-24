export default function ContasLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-36 bg-card rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-card rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
