import { supabaseAdmin } from "@/lib/supabase-admin";
import dynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import { memberSchema, witnessSchema, shotLogSchema } from "@/lib/validations";
import type { Member, Witness, LogItem } from "@/types/types";
import Loading from "./loading";

const ShotTrackerForm = dynamic(() => import("./components/ShotTrackerForm"), {
  loading: Loading,
  ssr: true,
});

const getCachedMembers = unstable_cache(
  async () => {
    const { data } = await supabaseAdmin
      .from("members")
      .select("*")
      .eq("is_active", true)
      .order("name");
    return memberSchema.array().parse(data || []);
  },
  ["active-members"],
  { revalidate: 60 },
);

const getCachedWitnesses = unstable_cache(
  async () => {
    const { data } = await supabaseAdmin
      .from("witnesses")
      .select("*")
      .order("name");
    return witnessSchema.array().parse(data || []);
  },
  ["witnesses-list"],
  { revalidate: 60 },
);

export default async function HomePage() {
  const [members, witnesses, logsRes] = await Promise.all([
    getCachedMembers(),
    getCachedWitnesses(),
    supabaseAdmin
      .from("shot_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const fetchedMembers: Member[] = members || [];
  const externalWitnesses: Witness[] = witnesses || [];
  const initialLogs: LogItem[] = shotLogSchema
    .array()
    .parse(logsRes.data || []);

  const membersWhoCanWitness = fetchedMembers.filter((m) =>
    ["ESS", "Joker"].includes(m.group_type),
  );
  const memberWitnesses: Witness[] = membersWhoCanWitness.map((m) => ({
    id: m.id,
    name: m.name,
  }));
  const combined = [...externalWitnesses, ...memberWitnesses];
  const uniqueWitnesses = Array.from(
    new Map(combined.map((item) => [item.name, item])).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ShotTrackerForm
      initialMembers={fetchedMembers}
      initialWitnesses={uniqueWitnesses}
      initialLogs={initialLogs}
    />
  );
}
