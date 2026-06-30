import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/, 'must contain a letter')
    .regex(/[0-9]/, 'must contain a number'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
