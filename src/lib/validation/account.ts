import { z } from "zod";

export const accountUpdateSchema = z.object({
  fullName: z.string().trim().min(1, "Required").max(120),
});

export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
