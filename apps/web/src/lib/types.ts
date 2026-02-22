import { z } from "zod"

export const userSchema = z.object({
  netId: z.string(),
  fName: z.string(),
  lName: z.string(),
  email: z.string(),
  role: z.string(),
  // Add an ID for dnd-kit if not present in user object, though netId is unique
  id: z.string().optional(),
})

export type UserData = z.infer<typeof userSchema>
