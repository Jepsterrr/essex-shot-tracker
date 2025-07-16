function SkeletonRow() {
    return (
        <tr className="block lg:table-row mb-4 lg:mb-0 lg:border-b lg:border-gray-600/50 animate-pulse">
            {/* Person */}
            <td className="flex justify-between items-center p-3 lg:table-cell lg:py-4 lg:pl-4 lg:pr-3 sm:pl-6">
                <span className="font-bold lg:hidden mr-2 text-transparent">Person</span>
                <div className="h-4 bg-gray-600 rounded w-24"></div>
            </td>
            {/* Ändring */}
            <td className="flex justify-between items-center p-3 lg:table-cell lg:px-3 lg:py-4 lg:text-center">
                 <span className="font-bold lg:hidden mr-2 text-transparent">Ändring</span>
                <div className="h-4 bg-gray-600 rounded w-8 ml-auto lg:mx-auto"></div>
            </td>
            {/* Anledning */}
            <td className="flex justify-between items-start p-3 lg:table-cell lg:px-3 lg:py-4">
                 <span className="font-bold lg:hidden mr-2 text-transparent">Anledning</span>
                <div className="h-4 bg-gray-600 rounded w-32 ml-auto lg:ml-0"></div>
            </td>
            {/* Vittnen */}
            <td className="flex justify-between items-start p-3 lg:table-cell lg:px-3 lg:py-4">
                 <span className="font-bold lg:hidden mr-2 text-transparent">Vittnen</span>
                <div className="h-4 bg-gray-600 rounded w-28 ml-auto lg:ml-0"></div>
            </td>
            {/* Datum */}
            <td className="flex justify-between items-center p-3 lg:table-cell lg:py-4 lg:pl-3 lg:pr-4 lg:text-right sm:pr-6">
                 <span className="font-bold lg:hidden mr-2 text-transparent">Datum</span>
                <div className="h-4 bg-gray-600 rounded w-36 ml-auto lg:ml-0"></div>
            </td>
        </tr>
    );
}


export default function LoadingHistoryPage() {
  return (
    <div className="max-w-6xl mx-auto bg-card-white text-gray-800 rounded-xl shadow-2xl border border-gray-200/10">
      <div className="p-4 md:p-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-200 mb-2">Händelselogg</h1>
        <p className="text-gray-300 mb-6 md:mb-8">Historik över alla registrerade shots.</p>
        
        <div className="border-t border-gray-200 pt-6">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-600/50 hidden lg:table-header-group">
                      <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-200 sm:pl-6">Person</th>
                          <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-200">Ändring</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">Anledning</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">Vittnen</th>
                          <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-200 sm:pr-6">Datum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 lg:divide-y-0 bg-gray-600/50">
                        {/* Rendera ett antal skelettrader för att visa att något laddas */}
                        {[...Array(10)].map((_, i) => <SkeletonRow key={i} />)}
                    </tbody>
                </table>
            </div>

            {/* Inaktiva pagineringsknappar */}
            <div className="flex items-center justify-between mt-6">
                <button disabled className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed">
                    Föregående
                </button>
                <span className="text-sm font-semibold text-gray-400">
                    Laddar sidor...
                </span>
                <button disabled className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed">
                    Nästa
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}