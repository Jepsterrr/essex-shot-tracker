function StatCardSkeleton() {
  return (
    <div className="bg-gray-700/60 border border-gray-200 rounded-lg p-4 text-center animate-pulse">
      <div className="h-4 w-3/4 mx-auto bg-gray-600 rounded"></div>
      <div className="h-10 w-1/3 mx-auto bg-gray-600 rounded mt-2"></div>
    </div>
  );
}

export default function LoadingMemberDetailPage() {
  return (
    <div>
      {/* --- Header-sektion --- */}
      <div className="text-center mb-10 border-b-2 border-amber-400/50 pb-6 animate-pulse">
        <div className="h-16 w-1/2 bg-gray-700 rounded-lg mx-auto"></div>
        <div className="h-6 w-1/3 bg-gray-700 rounded-lg mx-auto mt-4"></div>
        <div className="h-10 w-32 bg-gray-600/40 rounded-lg mx-auto mt-6"></div>
      </div>

      {/* --- Övergripande Statistik --- */}
      <section className="mb-12">
        <div className="h-7 w-1/4 mx-auto bg-gray-700 rounded-lg mb-4"></div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </section>

      {/* --- Shots Mottagna & Avklarade --- */}
      <section className="mb-12">
        <div className="h-7 w-1/4 mx-auto bg-gray-700 rounded-lg mb-4"></div>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </section>

      {/* --- Detaljerad händelselogg --- */}
      <div className="mt-16 bg-card-white text-gray-800 rounded-xl shadow-lg p-4 md:p-6 animate-pulse">
        <div className="h-7 w-1/3 bg-gray-700 rounded-lg mb-4"></div>
        <div className="space-y-2">
          <div className="h-12 w-full bg-gray-600/40 rounded"></div>
          <div className="h-12 w-full bg-gray-600/35 rounded"></div>
          <div className="h-12 w-full bg-gray-600/40 rounded"></div>
        </div>
      </div>
    </div>
  );
}
