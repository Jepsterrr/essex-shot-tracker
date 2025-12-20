export interface Member {
  id: string;
  name: string;
  current_shots: number;
  group_type: "Kex" | "ESS" | "Joker";
  created_at: string;
  is_active: boolean;
}

export interface MemberWithStats extends Member {
  totalGiven: number;
  totalRemoved: number;
}

export interface ShotLog {
  id: string;
  created_at: string;
  change: number;
  reason: string | null;
  witnesses: string[] | null;
  members: {
    name: string;
  } | null;
}

export interface Witness {
  id: string;
  name: string;
}
