function LoadingSkeleton() {
  return (
    <div className="border border-gray-500 rounded-xl shadow-md p-5 flex flex-col justify-between animate-pulse">
      <div className="flex justify-between items-start text-gray-700 text-3xl">
        <span></span>
        <span></span>
      </div>
      <div className="text-center my-6">
        <div className="h-8 bg-gray-900 rounded w-3/4 mx-auto"></div>
        <div className="h-16 bg-gray-950 rounded w-1/3 mx-auto mt-4"></div>
        <div className="h-6 bg-gray-900 rounded w-1/2 mx-auto mt-2"></div>
      </div>
      <div className="flex justify-between items-end text-sm font-semibold text-gray-600">
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div>
      <h1 className="text-5xl font-serif font-bold text-center mb-12 text-essex-gold drop-shadow-lg">
        Skuldligan
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
