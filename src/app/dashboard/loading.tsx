export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-28 bg-card rounded" />
        <div className="h-9 w-48 bg-card rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-32 bg-card rounded-2xl" />
        <div className="h-32 bg-card rounded-2xl" />
      </div>
      <div className="h-20 bg-card rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-card rounded-2xl" />
        <div className="h-64 bg-card rounded-2xl" />
      </div>
    </div>
  )
}
