export default function TreinosLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-10 w-32 bg-card rounded" />
        <div className="h-10 w-36 bg-card rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-card rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
