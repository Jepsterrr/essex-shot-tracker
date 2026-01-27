import { z } from "zod";

export const memberSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  current_shots: z.number().int(),
  group_type: z.enum(["ESS", "Kex", "Joker"]),
  is_active: z.boolean(),
  created_at: z.string()
});

export const witnessSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, "Namn krävs"),
  created_at: z.string().optional(),
});

export const shotLogSchema = z.object({
  id: z.uuid(),
  member_id: z.uuid(),
  change: z.number().int().refine((n) => n !== 0, "Ändringen kan inte vara 0"),
  reason: z.string().nullable().optional(),
  witnesses: z.array(z.string()),
  giver_ids: z.array(z.uuid()).nullable().optional(),
  group_type_at_log_time: z.string(),
  created_at: z.string()
});

export const joinedShotLogSchema = z.object({
  id: z.uuid(),
  created_at: z.string(),
  change: z.number().int(),
  reason: z.string().nullable(),
  witnesses: z.array(z.string()).nullable(),
  members: z.object({
    name: z.string()
  }).nullable()
});

export const logShotRequestSchema = z.object({
  member_id: z.uuid("Ogiltigt medlems-ID"),
  change: z.number().int(),
  reason: z.string().max(255, "Anledningen är för lång").optional(),
  witnesses: z.array(z.string()),
  group_type: z.string(),
  giver_ids: z.array(z.uuid())
});

export type Member = z.infer<typeof memberSchema>;
export type Witness = z.infer<typeof witnessSchema>;
export type LogItem = z.infer<typeof shotLogSchema>;
export type ShotLog = z.infer<typeof joinedShotLogSchema>;
export type LogShotRequest = z.infer<typeof logShotRequestSchema>;