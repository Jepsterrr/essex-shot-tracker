export default function LoadingArcade() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] w-full">
      <div className="relative w-16 h-16">
        {/* Yttre ring */}
        <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
        {/* Snurrande inre ring (Guld) */}
        <div className="absolute inset-0 border-4 border-essex-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-essex-gold font-serif text-lg animate-pulse tracking-widest">
        LADDAR...
      </p>
    </div>
  );
}