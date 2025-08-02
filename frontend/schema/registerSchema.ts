import z from "zod";

export const registerSchem = z.object({
  username: z.string().min(3, "Username is required"),
  email: z.email({ error: "Invalid email" }),
  firstName: z.string().min(4, "Frist name is required"),
  lastName: z.string().min(4, "Last name is required"),
  password: z.string().min(8, "Password is required"),
});

export type RegisterSchemaType = z.infer<typeof registerSchem>;
