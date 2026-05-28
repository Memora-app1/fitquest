export default function SaudeLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="h-32 rounded-2xl shimmer" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl shimmer" />)}
      </div>
      <div className="h-48 rounded-2xl shimmer" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-64 rounded-2xl shimmer" />
        <div className="h-64 rounded-2xl shimmer" />
      </div>
    </div>
  )
}
