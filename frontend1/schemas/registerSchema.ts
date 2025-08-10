import { z } from "zod";

export const registerSchema = z
  .object({
    // User fields
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    firstName: z.string().min(2, {
      message: "First name must be at least 2 characters.",
    }),
    lastName: z.string().min(2, {
      message: "Last name must be at least 2 characters.",
    }),
    username: z.string().min(3, {
      message: "Username must be at least 3 characters.",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Please confirm your password.",
    }),
    
    // Organization fields (conditional)
    accountType: z.enum(["individual", "organization"], {
      required_error: "Please select an account type.",
    }),
    organizationName: z.string().optional(),
    phoneNumber: z.string().optional(),
    website: z.string().url({
      message: "Please enter a valid URL.",
    }).optional().or(z.literal('')),
    
    // Subscription fields (conditional on organization)
    planId: z.string().optional(),
    planDurationId: z.string().optional(),
    autoRenew: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    if (data.accountType === "organization") {
      return data.organizationName && data.organizationName.trim().length > 0;
    }
    return true;
  }, {
    message: "Organization name is required for organization accounts.",
    path: ["organizationName"],
  });

export type RegisterSchemaType = z.infer<typeof registerSchema>;
