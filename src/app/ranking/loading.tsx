export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <div className="shimmer h-32 rounded-2xl" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="shimmer h-16 rounded-2xl" />
      ))}
    </div>
  );
}
