import { apiGet, apiPost } from './apiService';
import type { 
  SubscriptionPlan, 
  PlanDuration, 
  OrganizationSubscription,
  OrganizationRegistrationData
} from '@/types/subscription';

export type { 
  SubscriptionPlan, 
  PlanDuration, 
  OrganizationRegistrationData 
};

// Base path for subscription-related endpoints
// The base URL already includes /api/v1/ from apiService
const API_BASE = '/org/subscription';

/**
 * Fetches all available subscription plans
 */
export const fetchSubscriptionPlans = async (): Promise<{ data: SubscriptionPlan[] | null; error: string | null }> => {
  try {
    console.log('Fetching subscription plans from:', `${API_BASE}/plans/`);
    const response = await apiGet<{ results: SubscriptionPlan[] } | SubscriptionPlan[]>(
      `${API_BASE}/plans/`
    );
    console.log('Received subscription plans response:', response);
    
    // Handle paginated response (response.results) or direct array response
    const plans = Array.isArray(response) ? response : (response?.results || []);
    console.log('Extracted subscription plans:', plans);
    
    if (!Array.isArray(plans)) {
      const errorMsg = 'Unexpected response format from server';
      console.error(errorMsg, response);
      return { data: null, error: errorMsg };
    }
    
    if (plans.length === 0) {
      const errorMsg = 'No subscription plans available. Please contact support.';
      console.warn(errorMsg);
      return { data: [], error: errorMsg };
    }
    
    // Process plans and ensure all IDs are numbers
    const processedPlans = plans.map(plan => ({
      ...plan,
      id: Number(plan.id), // Ensure ID is a number
      // Convert any string numbers to numbers for price and discount
      durations: Array.isArray(plan.durations) ? plan.durations.map(duration => ({
        ...duration,
        id: Number(duration.id), // Ensure ID is a number
        plan: Number(duration.plan), // Ensure plan ID is a number
        price: typeof duration.price === 'string' ? parseFloat(duration.price) : duration.price,
        discount_percentage: typeof duration.discount_percentage === 'string' 
          ? parseFloat(duration.discount_percentage) 
          : duration.discount_percentage
      })) : []
    }));
    
    return { data: processedPlans, error: null };
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to load subscription plans. Please try again later.';
    return { data: null, error: errorMessage };
  }
};

/**
 * Fetches available durations for a specific subscription plan
 * @param planId - The ID of the subscription plan
 */
export const fetchPlanDurations = async (planId: number): Promise<{ data: PlanDuration[] | null; error: string | null }> => {
  if (!planId) {
    const errorMsg = 'Plan ID is required to fetch durations';
    console.error(errorMsg);
    return { data: null, error: errorMsg };
  }
  
  try {
    console.log(`Fetching durations for plan ${planId} from:`, `${API_BASE}/plans/${planId}/durations/`);
    const response = await apiGet<PlanDuration[] | { results: PlanDuration[] }>(
      `${API_BASE}/plans/${planId}/durations/`
    );
    
    // Handle both array and paginated responses
    const durations = Array.isArray(response) 
      ? response 
      : (Array.isArray(response?.results) ? response.results : []);
    
    console.log(`Received ${durations.length} durations for plan ${planId}`);
    
    if (durations.length === 0) {
      const errorMsg = `No billing cycles available for the selected plan (ID: ${planId}). Please try another plan or contact support.`;
      console.warn(errorMsg);
      return { data: [], error: errorMsg };
    }
    
    // Process durations to ensure proper types
    const processedDurations = durations.map(duration => ({
      ...duration,
      id: Number(duration.id), // Ensure ID is a number
      plan: Number(duration.plan), // Ensure plan ID is a number
      price: typeof duration.price === 'string' ? parseFloat(duration.price) : duration.price,
      discount_percentage: typeof duration.discount_percentage === 'string' 
        ? parseFloat(duration.discount_percentage) 
        : duration.discount_percentage
    }));
    
    // Filter out any durations with missing or invalid IDs
    const validDurations = processedDurations.filter(duration => 
      duration.id !== undefined && duration.id !== null && !isNaN(Number(duration.id))
    );
    
    if (validDurations.length === 0) {
      const errorMsg = 'No valid billing cycles available due to data format issues. Please contact support.';
      console.error(errorMsg, { planId, rawDurations: durations });
      return { data: null, error: errorMsg };
    }
    
    // Log each duration's details for debugging
    console.log(`Processed ${validDurations.length} valid durations for plan ${planId}:`, 
      validDurations.map(d => ({
        id: d.id,
        months: d.duration_months,
        price: d.price,
        discount: d.discount_percentage,
        isDefault: d.is_default
      }))
    );
    
    return { data: validDurations, error: null };
  } catch (error: any) {
    console.error(`Error fetching durations for plan ${planId}:`, error);
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        `Failed to load billing cycles for the selected plan. Please try again later.`;
    return { data: null, error: errorMessage };
  }
};

/**
 * Fetches the active subscription for an organization
 * @param orgId - The ID of the organization
 */
export const getOrganizationSubscription = async (
  orgId: string
): Promise<OrganizationSubscription | null> => {
  if (!orgId) return null;
  
  try {
    // The endpoint is /api/v1/subscription/subscriptions/?organization={orgId}&is_active=true
    const response = await apiGet<OrganizationSubscription[]>(
      `${API_BASE}/subscriptions/?organization=${orgId}&is_active=true`
    );
    return Array.isArray(response) ? response[0] || null : null;
  } catch (error) {
    console.error(`Error fetching subscription for organization ${orgId}:`, error);
    return null;
  }
};

// Helper function to format price with currency
export const formatPrice = (price: number | string): string => {
  // Convert price to number if it's a string
  const priceNumber = typeof price === 'string' ? parseFloat(price) : price;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceNumber);
};

// Helper function to get display text for a plan duration
export const getDurationDisplay = (duration: PlanDuration): string => {
  if (!duration) return '';
  
  const months = duration.duration_months;
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  if (months === 12) return '1 year';
  return `${months / 12} years`;
};

/**
 * Register a new organization with subscription
 * @param data - Organization and admin user data
 */
// Custom error type that includes response
class ApiError extends Error {
  response: any;
  
  constructor(message: string, response?: any) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const registerOrganization = async (
  data: OrganizationRegistrationData
): Promise<{
  user: any;
  organization: any;
  message: string;
}> => {
  try {
    console.log('Sending registration request to /org/register/ with data:', data);
    const response = await apiPost('/org/register/', data);
    console.log('Registration API response:', response);
    
    // Handle different response formats
    if (response && response.data) {
      return response.data;
    } else if (response) {
      // If response is not in the expected format but exists
      return {
        user: response.user || null,
        organization: response.organization || null,
        message: response.message || 'Organization registered successfully'
      };
    }
    
    throw new Error('Invalid response from server');
  } catch (error: any) {
    console.error('Error registering organization:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    // Create a more detailed error object
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        error.message || 
                        'Failed to register organization';
    
    throw new ApiError(errorMessage, error.response);
  }
};
