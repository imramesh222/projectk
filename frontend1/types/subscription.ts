export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  durations: PlanDuration[];
}

export interface PlanDuration {
  id: number;
  plan: number;  // plan ID
  duration_months: number;
  price: number;
  discount_percentage: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSubscription {
  id: number;
  organization: number;  // organization ID
  plan_duration: number; // plan_duration ID
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
