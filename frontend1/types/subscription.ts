export interface SubscriptionPlan {
  id: number;  // Using number to match backend
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  durations: PlanDuration[];
}

export interface PlanDuration {
  id: number;  // Changed to number to match backend
  plan: number;  // plan ID as number
  duration_months: number;
  price: number | string;  // Can be string from API, will be converted to number
  discount_percentage: number | string;  // Can be string from API
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSubscription {
  id: number;
  organization: number;  // organization ID
  plan_duration: string; // plan_duration ID as UUID string
  start_date: string;
  end_date: string;
  is_active: boolean;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan_details: {
    plan: {
      id: number;
      name: string;
      description: string;
    };
    duration: {
      months: number;
      price: number;
      discount_percentage: number;
    };
  };
}

export interface OrganizationRegistrationData {
  // User fields
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
  
  // Organization fields
  organization_name: string;
  website?: string;
  phone_number?: string;
  
  // Subscription fields
  plan_duration_id?: number;
  auto_renew?: boolean;
}

export interface OrganizationRegistrationResponse {
  user: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
  };
  organization?: {
    id: string;
    name: string;
    role: string;
  };
  message: string;
}
