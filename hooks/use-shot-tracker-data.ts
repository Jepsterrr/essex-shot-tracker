import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { cacheData } from "@/lib/offline-queue";
import type { Member, Witness, LogItem } from "@/types/types";

export function useShotTrackerData(
  initialMembers: Member[],
  initialWitnesses: Witness[],
  initialLogs: LogItem[],
) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [allWitnessOptions, setAllWitnessOptions] =
    useState<Witness[]>(initialWitnesses);
  const [recentLogs, setRecentLogs] = useState<LogItem[]>(initialLogs);

  useEffect(() => {
    const channel = supabase
      .channel(`live-updates-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        (payload) => {
          setMembers((current) => {
            let updated = [...current];
            if (payload.eventType === "INSERT") {
              const m = payload.new as Member;
              if (m.is_active && !updated.find((x) => x.id === m.id))
                updated.push(m);
            } else if (payload.eventType === "UPDATE") {
              const m = payload.new as Member;
              updated = m.is_active
                ? updated.map((x) => (x.id === m.id ? m : x))
                : updated.filter((x) => x.id !== m.id);
            } else if (payload.eventType === "DELETE") {
              updated = updated.filter((x) => x.id !== payload.old.id);
            }
            const sorted = updated.sort((a, b) => a.name.localeCompare(b.name));
            cacheData(sorted, allWitnessOptions);
            return sorted;
          });

          setAllWitnessOptions((currentWitnesses) => {
            const shouldBeWitness = (m: any) =>
              m.is_active && ["ESS", "Joker"].includes(m.group_type);
            let updated = [...currentWitnesses];

            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              const m = payload.new as any;
              if (shouldBeWitness(m)) {
                const exists = updated.findIndex((w) => w.id === m.id);
                if (exists >= 0) updated[exists] = { id: m.id, name: m.name };
                else updated.push({ id: m.id, name: m.name });
              } else {
                updated = updated.filter((w) => w.id !== m.id);
              }
            } else if (payload.eventType === "DELETE") {
              updated = updated.filter((w) => w.id !== payload.old.id);
            }
            return updated.sort((a, b) => a.name.localeCompare(b.name));
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shot_log" },
        (payload) => {
          const newLog = payload.new as LogItem;
          setRecentLogs((prev) => [newLog, ...prev].slice(0, 15));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [allWitnessOptions]);

  return { members, allWitnessOptions, recentLogs, setRecentLogs };
}
