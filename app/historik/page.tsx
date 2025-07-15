'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { ShotLog } from '@/types/types';

const ITEMS_PER_PAGE = 25;

export default function HistoryPage() {
  const [history, setHistory] = useState<ShotLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function getHistory() {
      setIsLoading(true);
      setError(null);
      
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error: fetchError, count } = await supabase
        .from('shot_log')
        .select(`
          id,
          created_at,
          change,
          reason,
          witnesses,
          members ( name )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) {
        console.error('Error fetching history:', fetchError);
        setError('Kunde inte hämta historiken. Försök igen senare.');
        setHistory([]);
      } else {
        setHistory(data as unknown as ShotLog[]);
        setTotalCount(count || 0);
      }
      setIsLoading(false);
    }

    getHistory();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto bg-card-white text-gray-800 rounded-xl shadow-2xl border border-gray-200/10">
      <div className="p-4 md:p-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-2">Händelselogg</h1>
        <p className="text-gray-600 mb-6 md:mb-8">Historik över alla registrerade shots.</p>
        
        <div className="border-t border-gray-200 pt-6">
            {isLoading ? (
                <p className="text-center text-gray-500 py-12">Laddar historik...</p>
            ) : error ? (
                <p className="text-center text-red-600 bg-red-50 p-4 rounded-md">{error}</p>
            ) : history.length === 0 ? (
                <p className="text-center text-gray-500 py-12">Inga händelser har loggats än.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 hidden lg:table-header-group">
                              <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Person</th>
                                  <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Ändring</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Anledning</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vittnen</th>
                                  <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6">Datum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 lg:divide-y-0 bg-white">
                            {history.map((log) => (
                                <tr key={log.id} className="block lg:table-row mb-4 lg:mb-0 lg:border-b lg:border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="flex justify-between items-center p-3 lg:table-cell lg:py-4 lg:pl-4 lg:pr-3 lg:whitespace-nowrap sm:pl-6">
                                        <span className="font-bold lg:hidden mr-2">Person</span>
                                        <span className="text-right lg:text-left font-medium text-gray-900">{log.members?.name ?? 'Raderad'}</span>
                                    </td>
                                    <td className={`flex justify-between items-center p-3 lg:table-cell lg:px-3 lg:py-4 lg:whitespace-nowrap lg:text-center font-bold ${log.change > 0 ? 'text-red-600' : log.change < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                        <span className="font-bold lg:hidden mr-2">Ändring</span>
                                        <span>{log.change > 0 ? `+${log.change}` : log.change}</span>
                                    </td>
                                    <td className="flex justify-between items-start p-3 lg:table-cell lg:px-3 lg:py-4 lg:items-center">
                                        <span className="font-bold lg:hidden mr-2">Anledning</span>
                                        <span className="text-right lg:text-left text-sm break-words">{log.reason || '-'}</span>
                                    </td>
                                    <td className="flex justify-between items-start p-3 lg:table-cell lg:px-3 lg:py-4 lg:items-center">
                                        <span className="font-bold lg:hidden mr-2 pt-0.5">Vittnen</span>
                                        <span className="text-right lg:text-left text-sm break-words">{log.witnesses?.join(', ') || '-'}</span>
                                    </td>
                                    <td className="flex justify-between items-center p-3 lg:table-cell lg:py-4 lg:pl-3 lg:pr-4 lg:whitespace-nowrap lg:text-right sm:pr-6">
                                      <span className="font-bold lg:hidden mr-2">Datum</span>
                                      <span className="text-sm">
                                        {new Date(log.created_at).toLocaleString('sv-SE', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' })}
                                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginering-knappar */}
                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={currentPage === 1 || isLoading}
                            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                        >
                            Föregående
                        </button>
                        <span className="text-sm font-semibold">
                            Sida {currentPage} av {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage === totalPages || isLoading}
                            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                        >
                            Nästa
                        </button>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
}