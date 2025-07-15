import { createClient } from '@supabase/supabase-js';
import type { ShotLog } from '@/types/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getHistory(): Promise<ShotLog[]> {
  const { data, error } = await supabase
    .from('shot_log')
    .select(`
      id,
      created_at,
      change,
      reason,
      witnesses,
      members ( name )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }
  return data as unknown as ShotLog[];
}

export default async function HistoryPage() {
  const history = await getHistory();

  return (
    <div className="max-w-6xl mx-auto bg-card-white text-gray-800 rounded-xl shadow-2xl border border-gray-200/10">
      <div className="p-4 md:p-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-2">Händelselogg</h1>
        <p className="text-gray-600 mb-6 md:mb-8">Historik över alla registrerade shots.</p>
        
        <div className="border-t border-gray-200 pt-6">
            {history.length === 0 ? (
                <p className="text-center text-gray-500 py-12">Inga händelser har loggats än.</p>
            ) : (
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
            )}
        </div>
      </div>
    </div>
  );
}