function StatCardSkeleton() {
  return (
    <div className="bg-gray-700/60 p-6 rounded-xl border border-gray-600 animate-pulse">
      <div className="h-12 w-16 bg-gray-800 rounded-md"></div>
      <div className="h-6 w-3/4 bg-gray-800 rounded-md mt-4"></div>
      <div className="h-4 w-full bg-gray-800 rounded-md mt-2"></div>
    </div>
  );
}

function QuickLinkSkeleton() {
  return (
    <div className="bg-gray-700/60 p-6 rounded-xl border border-gray-600 animate-pulse">
      <div className="h-6 w-1/2 bg-gray-800 rounded-md"></div>
      <div className="h-4 w-full bg-gray-800 rounded-md mt-3"></div>
    </div>
  );
}

export default function LoadingAdminDashboard() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-5xl font-serif font-bold text-gray-200 mb-2">
        Admin-översikt
      </h1>
      <p className="text-gray-400 mb-8">
        En överblick av systemet och snabblänkar för administration.
      </p>

      {/* --- Statistik Skeletons --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* --- Snabblänkar Skeletons --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickLinkSkeleton />
        <QuickLinkSkeleton />
      </div>
    </div>
  );
}
