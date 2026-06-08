export default function Loading() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
      <div className="h-32 rounded-2xl shimmer" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl shimmer" />
      ))}
    </div>
  )
}
