export default function Loading() {
    return (
        <div className="max-w-3xl mx-auto pb-20 animate-pulse">
        {/* Rubrik Skeleton */}
            <h1 className="text-5xl font-serif font-bold text-center mb-8 text-essex-gold drop-shadow-lg">
                Shot-Protokoll
            </h1>

            <div className="space-y-8 bg-card-white p-6 sm:p-8 rounded-xl border border-gray-200/10">
            
                {/* Välj medlem Skeleton */}
                <div>
                    <div className="h-6 w-1/3 bg-gray-700 rounded mb-3"></div>
                    <div className="h-14 w-full bg-gray-600/50 rounded-xl"></div>
                </div>

                {/* Läge & Antal Skeleton */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-1 bg-gray-900 p-1 rounded-xl border border-gray-600">
                        <div className="h-14 bg-gray-700 rounded-lg"></div>
                        <div className="h-14 bg-gray-700 rounded-lg"></div>
                    </div>
                    <div className="h-20 w-full bg-gray-600/30 rounded-xl"></div>
                </div>

                {/* Vittnen Skeleton */}
                <div>
                    <div className="h-6 w-1/4 bg-gray-700 rounded mb-3"></div>
                        <div className="flex flex-wrap gap-3">
                        <div className="h-10 w-20 bg-gray-700 rounded-lg"></div>
                        <div className="h-10 w-24 bg-gray-700 rounded-lg"></div>
                        <div className="h-10 w-16 bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Submit Knapp Skeleton */}
                <div className="pt-4">
                    <div className="h-16 w-full bg-gray-700 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}