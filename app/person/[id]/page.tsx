import { createClient } from '@supabase/supabase-js';
import type { ShotLog } from '@/types/types';
import PaginatedLogTable from './PaginatedLogTable';
import BackButton from './BackButton';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Funktion för att hämta all data vi behöver för sidan
async function getMemberDetails(id: string) {
  const memberPromise = supabase.from('members').select('*').eq('id', id).single();
  const logsPromise = supabase.from('shot_log').select('*, group_type_at_log_time').eq('member_id', id);

  const [{ data: member, error: memberError }, { data: logs, error: logsError }] = await Promise.all([
    memberPromise,
    logsPromise
  ]);

  if (memberError || logsError) {
    console.error('Error fetching member details:', memberError || logsError);
    return { member: null, logs: [], stats: null };
  }

  // --- Logik för att beräkna statistik ---
  const stats = logs.reduce((acc, log) => {
    const isKex = log.group_type_at_log_time === 'Kex';
    const isEss = log.group_type_at_log_time === 'ESS';
    
    if (log.change > 0) { // Någon har gett ett straff
      acc.totalGiven += log.change;
      if (isKex) acc.givenAsKex += log.change;
      if (isEss) acc.givenAsEss += log.change;
      if (log.change > acc.biggestSingleAddition) {
        acc.biggestSingleAddition = log.change;
      }
    } else { // Medlemmen har tagit bort/druckit shots
      acc.totalRemoved += Math.abs(log.change);
      if (isKex) acc.removedAsKex += Math.abs(log.change);
      if (isEss) acc.removedAsEss += Math.abs(log.change);
    }
    
    return acc;
  }, {
    totalGiven: 0,
    totalRemoved: 0,
    givenAsKex: 0,
    givenAsEss: 0,
    removedAsKex: 0,
    removedAsEss: 0,
    biggestSingleAddition: 0,
    totalLogs: logs.length,
  });

  return { member, logs: logs as ShotLog[], stats };
}

// --- Komponenter för att visa statistik ---

function StatCard({ title, value, colorClass = 'text-gray-200' }: { title: string; value: string | number; colorClass?: string }) {
  return (
    <div className="bg-gray-700/60 border border-gray-200 rounded-lg p-4 text-center">
      <p className="text-sm font-medium text-gray-300 uppercase tracking-wider">{title}</p>
      <p className={`text-4xl font-bold mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
}

// --- Huvudkomponenten för sidan ---

export default async function MemberDetailPage({ params }: { params: any }) {
  const { id } = params;
  const { member, logs, stats } = await getMemberDetails(id);

  if (!member || !stats) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-500">Medlem hittades inte</h1>
        <p className="text-gray-200">Kunde inte hitta någon medlem med detta ID.</p>
        <div className="mt-8">
            <BackButton text="Tillbaka till Skuldligan" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* --- Header-sektion med namn --- */}
      <div className="text-center mb-10 border-b-2 border-amber-400/50 pb-6">
        <h1 className="text-6xl font-serif font-bold text-essex-gold drop-shadow-lg">{member.name}</h1>
        <p className="text-2xl text-gray-300 mt-2">Statistiköversikt</p>
        <div className="w-full/50 mt-4">
            <BackButton />
        </div>
      </div>

      {/* --- Övergripande Statistik --- */}
      <section className="mb-12">
        <h2 className="text-2xl font-serif text-center font-semibold mb-4 text-gray-200">Övergripande</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard title="Nuvarande skuld" value={member.current_shots} colorClass="text-essex-red" />
            <StatCard title="Största enskilda straff" value={stats.biggestSingleAddition} />
            <StatCard title="Totalt avklarade" value={stats.totalRemoved} colorClass="text-green-600" />
        </div>
      </section>

      {/* --- Shots Tilldelade (Kex vs ESS) --- */}
      <section className="mb-12">
          <h2 className="text-2xl font-serif text-center font-semibold mb-4 text-gray-200">Shots Mottagna</h2>
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard title="Som KEX" value={stats.givenAsKex} colorClass="text-red-500" />
              <StatCard title="Som ESS" value={stats.givenAsEss} colorClass="text-red-500" />
          </div>
      </section>

      {/* --- Avklarade Shots (Kex vs ESS) --- */}
      <section>
          <h2 className="text-2xl font-serif text-center font-semibold mb-4 text-gray-200">Avklarade Shots</h2>
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard title="Som KEX" value={stats.removedAsKex} colorClass="text-green-600" />
              <StatCard title="Som ESS" value={stats.removedAsEss} colorClass="text-green-600" />
          </div>
      </section>

      {/* --- Detaljerad händelselogg för medlemmen (nu responsiv) --- */}
      <div className="mt-16 bg-card-white text-gray-800 rounded-xl shadow-lg p-4 md:p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-200">Personlig Händelselogg</h2>
        <PaginatedLogTable logs={logs} />
      </div>
    </div>
  );
}