import { Member, Witness } from "@/types/types";

export interface QueuedShot {
  id: string;
  timestamp: number;
  payload: any;
}

const STORAGE_KEYS = {
  QUEUE: "offline_shot_queue",
  MEMBERS: "offline_members_cache",
  WITNESSES: "offline_witnesses_cache",
};

// Kö-hantering för straff
export const addToQueue = (payload: any) => {
  if (typeof window === "undefined") return;
  
  const currentQueue: QueuedShot[] = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.QUEUE) || "[]"
  );

  const newItem: QueuedShot = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    payload,
  };

  currentQueue.push(newItem);
  localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(currentQueue));
  return newItem;
};

export const getQueue = (): QueuedShot[] => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || "[]");
};

export const clearQueue = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.QUEUE);
};

export const removeFromQueue = (id: string) => {
  if (typeof window === "undefined") return;
  const currentQueue = getQueue();
  const newQueue = currentQueue.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(newQueue));
};

// Cache-hantering för medlemmar
export const cacheData = (members: Member[], witnesses: Witness[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  localStorage.setItem(STORAGE_KEYS.WITNESSES, JSON.stringify(witnesses));
};

export const getCachedData = () => {
  if (typeof window === "undefined") return { members: [], witnesses: [] };
  
  const m = localStorage.getItem(STORAGE_KEYS.MEMBERS);
  const w = localStorage.getItem(STORAGE_KEYS.WITNESSES);
  
  return {
    members: m ? JSON.parse(m) : [],
    witnesses: w ? JSON.parse(w) : [],
  };
};