export default function CoachLoading() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto h-screen flex flex-col gap-4 animate-pulse">
      <div className="h-10 w-48 bg-card rounded" />
      <div className="flex-1 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`h-16 bg-card rounded-2xl ${i % 2 === 0 ? 'w-3/4' : 'w-3/4 ml-auto'}`}
          />
        ))}
      </div>
      <div className="h-14 bg-card rounded-2xl" />
    </div>
  )
}
