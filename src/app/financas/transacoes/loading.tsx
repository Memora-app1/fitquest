export default function TransacoesLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-40 bg-card rounded" />
      <div className="flex gap-3">
        <div className="h-10 w-28 bg-card rounded-xl" />
        <div className="h-10 w-28 bg-card rounded-xl" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-card rounded-xl" />
        ))}
      </div>
    </div>
  )
}
