export default function SaudeLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="shimmer h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="shimmer h-24 rounded-2xl" />
        ))}
      </div>
      <div className="shimmer h-48 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="shimmer h-64 rounded-2xl" />
        <div className="shimmer h-64 rounded-2xl" />
      </div>
    </div>
  );
}
