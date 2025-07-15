export interface Member {
  id: string;
  name: string;
  current_shots: number;
  group_type: string;
  created_at: string;
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