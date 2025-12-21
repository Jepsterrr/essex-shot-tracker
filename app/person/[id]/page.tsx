import { supabase } from "@/lib/supabase-client";
import type { ShotLog } from "@/types/types";
import PaginatedLogTable from "./PaginatedLogTable";
import WitnessLogTable from "./WitnessLogTable";
import BackButton from "./BackButton";

export const dynamic = "force-dynamic";

// Funktion för att hämta all data vi behöver för sidan
async function getMemberDetails(id: string) {
  const memberPromise = supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  const logsPromise = supabase
    .from("shot_log")
    .select("*, group_type_at_log_time")
    .eq("member_id", id);

  const witnessLogsPromise = supabase
    .from("shot_log")
    .select("*, members(name)")
    .filter("giver_ids", "cs", `["${id}"]`) 
    .order("created_at", { ascending: false });

  const [
    { data: member, error: memberError },
    { data: logs, error: logsError },
    { data: witnessLogs, error: witnessLogsError }
  ] = await Promise.all([memberPromise, logsPromise, witnessLogsPromise]);

  if (memberError) {
    console.error("Error fetching member:", memberError);
    return { member: null, logs: [], witnessLogs: [], stats: null, shotsGivenCount: 0 };
  }
  else if (logsError) {
    console.error("Error fetching logs:", logsError);
    return { member: null, logs: [], witnessLogs: [], stats: null, shotsGivenCount: 0 };
  }
  else if (witnessLogsError) {
    console.error("Error fetching witness logs:", witnessLogsError);
  }

  // --- Logik för att beräkna statistik ---
  const stats = (logs || []).reduce(
    (acc, log) => {
      const isKex = log.group_type_at_log_time === "Kex";
      const isEss = log.group_type_at_log_time === "ESS";

      if (log.change > 0) {
        acc.totalGiven += log.change;
        if (isKex) acc.givenAsKex += log.change;
        if (isEss) acc.givenAsEss += log.change;
        if (log.change > acc.biggestSingleAddition) {
          acc.biggestSingleAddition = log.change;
        }
      } else {
        acc.totalRemoved += Math.abs(log.change);
        if (isKex) acc.removedAsKex += Math.abs(log.change);
        if (isEss) acc.removedAsEss += Math.abs(log.change);
      }
      return acc;
    },
    {
      totalGiven: 0,
      totalRemoved: 0,
      givenAsKex: 0,
      givenAsEss: 0,
      removedAsKex: 0,
      removedAsEss: 0,
      biggestSingleAddition: 0,
    }
  );

  const shotsGivenCount = (witnessLogs || []).reduce((sum, log) => sum + log.change, 0);

  return { 
    member, 
    logs: (logs || []) as ShotLog[], 
    witnessLogs: (witnessLogs || []) as ShotLog[],
    stats, 
    shotsGivenCount
  };
}

// --- Komponenter för att visa statistik ---

function StatCard({
  title,
  value,
  colorClass = "text-gray-200",
}: {
  title: string;
  value: string | number;
  colorClass?: string;
}) {
  return (
    <div className="bg-gray-700/60 border border-gray-200 rounded-lg p-4 text-center">
      <p className="text-sm font-medium text-gray-300 uppercase tracking-wider">
        {title}
      </p>
      <p className={`text-4xl font-bold mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
}

// --- Huvudkomponenten för sidan ---

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { member, logs, witnessLogs, stats, shotsGivenCount } = await getMemberDetails(id);

  if (!member || !stats) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-500">
          Medlem hittades inte
        </h1>
        <p className="text-gray-200">
          Kunde inte hitta någon medlem med detta ID.
        </p>
        <div className="mt-8">
          <BackButton text="Tillbaka till Skuldligan" />
        </div>
      </div>
    );
  }

  const isEssOrJoker = member.group_type === "ESS" || member.group_type === "Joker";

  return (
    <div className="pb-20">
      {/* --- Header --- */}
      <div className="text-center mb-10 border-b-2 border-amber-400/50 pb-6">
        <h1 className="text-6xl font-serif font-bold text-essex-gold drop-shadow-lg">
          {member.name}
        </h1>
        <p className="text-2xl text-gray-300 mt-2 font-serif italic">{member.group_type}</p>
        <div className="mt-6">
          <BackButton />
        </div>
      </div>

      {/* --- Övergripande Statistik --- */}
      <section className="mb-12">
        <h2 className="text-2xl font-serif text-center font-semibold mb-4 text-gray-200">
          Karriärsöversikt
        </h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="Nuvarande skuld"
            value={member.current_shots}
            colorClass="text-essex-red"
          />
          <StatCard
            title="Totalt avklarade"
            value={stats.totalRemoved}
            colorClass="text-green-500"
          />
          {/* Visa endast 'Utdelade' för ESS/Joker */}
          {isEssOrJoker ? (
            <StatCard
              title="Utdelade Shots"
              value={shotsGivenCount}
              colorClass="text-amber-400"
            />
          ) : (
            <StatCard
              title="Största straff (Mottaget)"
              value={stats.biggestSingleAddition}
              colorClass="text-gray-200"
            />
          )}
        </div>
      </section>

      {/* --- Shots Mottagna & Avklarade (Detaljer) --- */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Mottagna */}
          <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-center text-red-400 mb-4">Mottagna Shots</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="block text-3xl font-bold text-white">{stats.givenAsKex}</span>
                <span className="text-xs text-gray-400 uppercase">Som KEX</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-white">{stats.givenAsEss}</span>
                <span className="text-xs text-gray-400 uppercase">Som ESS</span>
              </div>
            </div>
          </div>

          {/* Avklarade */}
          <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-center text-green-400 mb-4">Druckna Shots</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="block text-3xl font-bold text-white">{stats.removedAsKex}</span>
                <span className="text-xs text-gray-400 uppercase">Som KEX</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold text-white">{stats.removedAsEss}</span>
                <span className="text-xs text-gray-400 uppercase">Som ESS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TABELLER --- */}
      <div 
        className={`
          mt-8 w-full
          ${isEssOrJoker 
            ? "grid grid-cols-1 xl:grid-cols-2 gap-8" 
            : "flex justify-center" 
          }
        `}
      >
        
        {/* Vänster: Personlig Logg (Mottagna) */}
        <div className={`
          bg-card-white text-gray-800 rounded-xl shadow-lg p-4 md:p-6 border border-gray-200/10 w-full
          ${!isEssOrJoker ? "max-w-4xl" : ""}
        `}>
          <h2
            id="personal-top-anchor"
            className="text-2xl font-bold mb-4 text-gray-200 border-b border-gray-600 pb-2 scroll-mt-28"
          >
            Händelselogg (Mottaget)
          </h2>
          <PaginatedLogTable logs={logs} anchorId="personal-top-anchor" />
        </div>

        {/* Höger: Vittneslogg (Endast ESS/Joker) */}
        {isEssOrJoker && (
          <div className="bg-card-white text-gray-800 rounded-xl shadow-lg p-4 md:p-6 border border-amber-500/20 w-full">
            <h2 
              id="witness-top-anchor"
              className="text-2xl font-bold mb-4 text-amber-400 border-b border-amber-500/30 pb-2 scroll-mt-28"
            >
              Domarprotokoll (Utdelat)
            </h2>
            <WitnessLogTable logs={witnessLogs} anchorId="witness-top-anchor" />
          </div>
        )}

      </div>
    </div>
  );
}
