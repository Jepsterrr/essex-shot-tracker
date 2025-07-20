function LoadingCardSkeleton() {
  return (
    <div className="bg-card-white text-gray-800 rounded-xl shadow-lg p-6 border border-gray-200/10 flex flex-col animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/2 mx-auto"></div>
      <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto mt-3 mb-5"></div>
      <div className="space-y-3 flex-grow">
        <div className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg">
          <div className="h-5 bg-gray-700 rounded w-28"></div>
          <div className="h-5 bg-gray-700 rounded w-20"></div>
        </div>
        <div className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg">
          <div className="h-5 bg-gray-700 rounded w-32"></div>
          <div className="h-5 bg-gray-700 rounded w-16"></div>
        </div>
        <div className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg">
          <div className="h-5 bg-gray-700 rounded w-24"></div>
          <div className="h-5 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

export default function LoadingToplistPage() {
  return (
    <div>
      <h1 className="text-5xl font-serif font-bold text-center mb-12 text-essex-gold drop-shadow-lg">
        Hall of Shame & Fame
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <LoadingCardSkeleton />
        <LoadingCardSkeleton />
        <LoadingCardSkeleton />
        <LoadingCardSkeleton />
      </div>
    </div>
  );
}
