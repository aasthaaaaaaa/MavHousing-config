import { z } from 'zod';

export const userSchema = z.object({
  userId: z.number().optional(),
  netId: z.string(),
  utaId: z.string().optional(),
  fName: z.string(),
  mName: z.string().optional().nullable(),
  lName: z.string(),
  email: z.string(),
  role: z.string(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  studentStatus: z.string().optional().nullable(),
  staffPosition: z.string().optional().nullable(),
  requiresAdaAccess: z.boolean().optional(),
  // Add an ID for dnd-kit if not present in user object, though netId is unique
  id: z.string().optional(),
});

export type UserData = z.infer<typeof userSchema>;
