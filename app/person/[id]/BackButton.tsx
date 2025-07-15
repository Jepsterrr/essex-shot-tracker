'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ text = 'Tillbaka' }: { text?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-block bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
    >
      &larr; {text}
    </button>
  );
}