import { supabase } from "@/lib/supabase-client";
import type { Member } from "@/types/types";

export const dynamic = "force-dynamic";

interface Punisher extends Member {
  shots_given: number;
}
interface Martyr extends Member {
  total_received: number;
}
interface Hammer {
  change: number;
  reason: string;
  witnesses: string[];
  members: { id: string; name: string }[];
}
interface Consumer extends Member {
  shots_consumed: number;
}

async function getToplists() {
  const { data: punishers, error: pError } = await supabase.rpc(
    "get_top_punishers"
  );
  if (pError) console.error("Error fetching punishers:", pError);

  const { data: martyrs, error: mError } = await supabase.rpc(
    "get_top_martyrs"
  );
  if (mError) console.error("Error fetching martyrs:", mError);

  const { data: hammerData, error: hError } = await supabase.rpc(
    "get_top_hammers"
  );
  if (hError) console.error("Error fetching hammer:", hError);

  const { data: consumers, error: cError } = await supabase.rpc(
    "get_top_consumers"
  );
  if (cError) console.error("Error fetching consumers:", cError);

  const typedHammerData = (hammerData || []).map(
    (h: { members: { id: string; name: string } }) => ({
      ...h,
      members: [h.members],
    })
  );

  return {
    punishers: (punishers || []) as Punisher[],
    martyrs: (martyrs || []) as Martyr[],
    hammers: typedHammerData as Hammer[],
    consumers: (consumers || []) as Consumer[],
  };
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

export default async function ToplistPage() {
  const { punishers, martyrs, hammers, consumers } = await getToplists();

  return (
    <div>
      <h1 className="text-5xl font-serif font-bold text-center mb-12 text-essex-gold drop-shadow-lg">
        Hall of Shame & Fame
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <ToplistCard title="The Punisher" subtitle="Flest bevittnade shots">
          {punishers.length > 0 ? (
            punishers.map((p, i) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg"
              >
                <span className="text-lg font-bold text-gray-200">
                  {i + 1}. {p.name}
                </span>
                <span className="text-xl font-bold text-yellow-400">
                  {p.shots_given} shots
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 pt-10">
              Ingen har delat ut några shots än.
            </p>
          )}
        </ToplistCard>

        <ToplistCard title="The Martyr" subtitle="Mest mottagna shots (totalt)">
          {martyrs.length > 0 ? (
            martyrs.map((m, i) => (
              <div
                key={m.id}
                className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg"
              >
                <span className="text-lg font-bold text-gray-200">
                  {i + 1}. {m.name}
                </span>
                <span className="text-xl font-bold text-red-500">
                  {m.total_received} shots
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 pt-10">
              Ingen har fått några shots än.
            </p>
          )}
        </ToplistCard>

        <ToplistCard title="The Hammer" subtitle="Största enskilda straff">
          {hammers.length > 0 ? (
            hammers.map(
              (hammer, i) =>
                hammer.members &&
                hammer.members.length > 0 && (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg"
                  >
                    <span className="text-lg font-bold text-gray-200">
                      {i + 1}. {hammer.members[0].name}
                    </span>
                    <span className="text-xl font-bold text-red-500">
                      +{hammer.change} shots
                    </span>
                  </div>
                )
            )
          ) : (
            <p className="text-center text-gray-400 pt-10">
              Inga straff har delats ut än.
            </p>
          )}
        </ToplistCard>

        <ToplistCard title="The Tank" subtitle="Flest druckna shots">
          {consumers.length > 0 ? (
            consumers.map((c, i) => (
              <div
                key={c.id}
                className="flex justify-between items-center bg-gray-600/40 p-3 rounded-lg"
              >
                <span className="text-lg font-bold text-gray-200">
                  {i + 1}. {c.name}
                </span>
                <span className="text-xl font-bold text-green-500">
                  {c.shots_consumed} shots
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 pt-10">
              Ingen har druckit några shots än.
            </p>
          )}
        </ToplistCard>
      </div>
    </div>
  );
}
