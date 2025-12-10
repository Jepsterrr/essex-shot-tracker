import { supabase } from "@/lib/supabase-client";
import type { Member } from "@/types/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Punisher extends Member {
  shots_given: number;
}
interface Martyr extends Member {
  total_received: number;
}
interface Hammer {
  id: string;
  change: number;
  reason: string;
  witnesses: string[];
  members: { id: string; name: string }[];
}
interface Consumer extends Member {
  shots_consumed: number;
}

interface ToplistLimits {
  punishers: number;
  martyrs: number;
  hammers: number;
  consumers: number;
}

async function getToplists(limits: ToplistLimits) {
  const { data: punishers, error: pError } = await supabase.rpc(
    "get_top_punishers", { limit_count: limits.punishers, }
  );
  if (pError) console.error("Error fetching punishers:", pError);

  const { data: martyrs, error: mError } = await supabase.rpc(
    "get_top_martyrs", { limit_count: limits.martyrs, }
  );
  if (mError) console.error("Error fetching martyrs:", mError);

  const { data: hammerData, error: hError } = await supabase.rpc(
    "get_top_hammers", { limit_count: limits.hammers, }
  );
  if (hError) console.error("Error fetching hammer:", hError);

  const { data: consumers, error: cError } = await supabase.rpc(
    "get_top_consumers", { limit_count: limits.consumers, }
  );
  if (cError) console.error("Error fetching consumers:", cError);

  const typedHammerData = (hammerData || []).map(
    (h: { 
      id: string;
      members: { id: string; name: string } | { id: string; name: string }[];
    }) => ({
      ...h,
      members: Array.isArray(h.members) ? h.members : [h.members],
    })
  );

  return {
    punishers: (punishers || []) as Punisher[],
    martyrs: (martyrs || []) as Martyr[],
    hammers: typedHammerData as Hammer[],
    consumers: (consumers || []) as Consumer[],
  };
}

function ListControls({
  paramKey,
  currentLimit,
  searchParams,
}: {
  paramKey: string;
  currentLimit: number;
  searchParams: any;
}) {
  const createUrl = (newLimit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set(paramKey, newLimit.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="flex justify-center gap-3 mt-6 pt-4 border-t border-gray-700/20">
      {currentLimit > 5 && (
        <Link
          href={createUrl(5)}
          scroll={false}
          className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          Visa färre
        </Link>
      )}
      <Link
        href={createUrl(currentLimit + 5)}
        scroll={false}
        className="px-4 py-2 text-sm font-bold text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors shadow-md"
      >
        Visa fler
      </Link>
    </div>
  );
}

function ToplistCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card-white text-gray-800 rounded-xl shadow-lg p-6 border border-gray-200/10 flex flex-col">
      <h2 className="text-3xl font-serif font-bold text-essex-gold text-center">
        {title}
      </h2>
      <p className="text-center text-gray-400 mb-4 italic">"{subtitle}"</p>
      <div className="space-y-3 flex-grow">{children}</div>
    </div>
  );
}

export default async function ToplistPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const limits: ToplistLimits = {
    punishers: Number(searchParams.punisherLimit) || 5,
    martyrs: Number(searchParams.martyrLimit) || 5,
    hammers: Number(searchParams.hammerLimit) || 5,
    consumers: Number(searchParams.consumerLimit) || 5,
  };

  const { punishers, martyrs, hammers, consumers } = await getToplists(limits);

  return (
    <div className="pb-20">
      <h1 className="text-5xl font-serif font-bold text-center mb-12 text-essex-gold drop-shadow-lg">
        Hall of Shame & Fame
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* THE PUNISHER */}
        <ToplistCard title="The Punisher" subtitle="Flest bevittnade shots">
          {punishers.length > 0 ? (
            punishers.map((p, i) => (
              <Link 
                href={`/person/${p.id}`} 
                key={p.id}
                className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer group"
              >
                <span className="text-lg font-bold text-gray-200 group-hover:text-white">
                  {i + 1}. {p.name}
                </span>
                <span className="text-xl font-bold text-yellow-400">
                  {p.shots_given} <span className="text-sm font-normal text-gray-400">st</span>
                </span>
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-400 pt-10">
              Ingen har delat ut några shots än.
            </p>
          )}
          <ListControls
            paramKey="punisherLimit"
            currentLimit={limits.punishers}
            searchParams={searchParams}
          />
        </ToplistCard>

        {/* THE MARTYR */}
        <ToplistCard title="The Martyr" subtitle="Mest mottagna shots (totalt)">
          {martyrs.length > 0 ? (
            martyrs.map((m, i) => (
              <Link 
                href={`/person/${m.id}`} 
                key={m.id}
                className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer group"
              >
                <span className="text-lg font-bold text-gray-200 group-hover:text-white">
                  {i + 1}. {m.name}
                </span>
                <span className="text-xl font-bold text-red-500">
                  {m.total_received} <span className="text-sm font-normal text-gray-400">st</span>
                </span>
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-400 pt-10">
              Ingen har fått några shots än.
            </p>
          )}
          <ListControls
            paramKey="martyrLimit"
            currentLimit={limits.martyrs}
            searchParams={searchParams}
          />
        </ToplistCard>

        {/* THE HAMMER */}
        <ToplistCard title="The Hammer" subtitle="Största enskilda straff">
          {hammers.length > 0 ? (
            hammers.map((hammer, i) =>
                hammer.members && hammer.members.length > 0 && (
                  <Link
                    href={`/historik?logId=${hammer.id}`}
                    key={i}
                    className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-200 group-hover:text-white">
                        {i + 1}. {hammer.members[0].name}
                      </span>
                      <span className="text-xs text-gray-400 italic truncate max-w-[150px]">
                        {hammer.reason}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-red-500 whitespace-nowrap">
                      +{hammer.change} st
                    </span>
                  </Link>
                )
            )
          ) : (
            <p className="text-center text-gray-400 pt-10">
              Inga straff har delats ut än.
            </p>
          )}
          <ListControls
            paramKey="hammerLimit"
            currentLimit={limits.hammers}
            searchParams={searchParams}
          />
        </ToplistCard>

        {/* THE TANK */}
        <ToplistCard title="The Tank" subtitle="Flest druckna shots">
          {consumers.length > 0 ? (
            consumers.map((c, i) => (
              <Link
                href={`/person/${c.id}`}
                key={c.id}
                className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer group"
              >
                <span className="text-lg font-bold text-gray-200 group-hover:text-white">
                  {i + 1}. {c.name}
                </span>
                <span className="text-xl font-bold text-green-500">
                  {c.shots_consumed} <span className="text-sm font-normal text-gray-400">st</span>
                </span>
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-400 pt-10">
              Ingen har druckit några shots än.
            </p>
          )}
          <ListControls
            paramKey="consumerLimit"
            currentLimit={limits.consumers}
            searchParams={searchParams}
          />
        </ToplistCard>
      </div>
    </div>
  );
}
