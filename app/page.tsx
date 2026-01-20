import { supabaseAdmin } from "@/lib/supabase-admin";
import ShotTrackerForm from "./components/ShotTrackerForm";
import type { Member, Witness, LogItem } from "@/types/types";

export default async function HomePage() {
  const [membersRes, witnessesRes, logsRes] = await Promise.all([
    supabaseAdmin
      .from("members")
      .select("*")
      .eq("is_active", true)
      .order("name"),
    supabaseAdmin
      .from("witnesses")
      .select("*")
      .order("name"),
    supabaseAdmin
      .from("shot_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const fetchedMembers: Member[] = membersRes.data || [];
  const externalWitnesses: Witness[] = witnessesRes.data || [];
  const initialLogs: LogItem[] = logsRes.data || [];

  const membersWhoCanWitness = fetchedMembers.filter((m) =>
    ["ESS", "Joker"].includes(m.group_type)
  );
  const memberWitnesses: Witness[] = membersWhoCanWitness.map((m) => ({
    id: m.id,
    name: m.name,
  }));
  const combined = [...externalWitnesses, ...memberWitnesses];
  const uniqueWitnesses = Array.from(
    new Map(combined.map((item) => [item.name, item])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ShotTrackerForm
      initialMembers={fetchedMembers}
      initialWitnesses={uniqueWitnesses}
      initialLogs={initialLogs}
    />
  );
}
