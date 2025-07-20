function WitnessItemSkeleton() {
  return (
    <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 gap-3 bg-gray-600/30">
      <div className="h-5 w-32 bg-gray-700 rounded"></div>
      <div className="flex items-center justify-end space-x-2 flex-shrink-0">
        <div className="h-6 w-16 bg-gray-700 rounded-md"></div>
        <div className="h-6 w-20 bg-gray-700 rounded-md"></div>
      </div>
    </li>
  );
}

export default function LoadingAdminWitnessesPage() {
  return (
    <div className="max-w-4xl mx-auto bg-card-white text-gray-800 rounded-xl shadow-2xl border border-gray-300 animate-pulse">
      <div className="p-4 md:p-8">
        <div className="h-10 w-3/4 bg-gray-700 rounded mb-2"></div>
        <div className="h-5 w-full bg-gray-700 rounded mb-8"></div>

        {/* Sektion för att lägga till nytt vittne */}
        <div className="border-t border-gray-200 pt-6">
          <div className="h-6 w-1/3 bg-gray-700 rounded mb-4"></div>
          <div className="h-12 w-full bg-gray-700 rounded-md"></div>
        </div>

        {/* Sektion för nuvarande vittnen */}
        <div className="mt-10">
          <div className="h-6 w-1/3 bg-gray-700 rounded mb-3"></div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              <WitnessItemSkeleton />
              <WitnessItemSkeleton />
              <WitnessItemSkeleton />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
