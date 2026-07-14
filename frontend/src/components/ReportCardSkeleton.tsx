export function ReportCardSkeleton() {
  return (
    <div className="rounded-badge border border-contour bg-white p-4 animate-pulse">
      <div className="h-5 bg-contour/60 rounded w-3/4 mb-3" />
      <div className="h-3 bg-contour/40 rounded w-full mb-2" />
      <div className="h-3 bg-contour/40 rounded w-5/6 mb-4" />
      <div className="h-6 bg-contour/50 rounded w-24 mb-3" />
      <div className="h-3 bg-contour/30 rounded w-1/2" />
    </div>
  );
}
