import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
