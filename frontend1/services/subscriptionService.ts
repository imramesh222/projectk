import { apiGet } from './apiService';
import type { SubscriptionPlan, PlanDuration, OrganizationSubscription } from '@/types/subscription';

// Base path for subscription-related endpoints
// The base URL already includes /api/v1/ from apiService
const API_BASE = '/org/subscription';

/**
 * Fetches all available subscription plans
 */
export const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    console.log('Fetching subscription plans from:', `${API_BASE}/plans/`);
    const response = await apiGet<{ results: SubscriptionPlan[] }>(`${API_BASE}/plans/`);
    console.log('Received subscription plans response:', response);
    
    // Handle paginated response (response.results) or direct array response
    const plans = Array.isArray(response) ? response : (response?.results || []);
    console.log('Extracted subscription plans:', plans);
    
    if (!Array.isArray(plans)) {
      console.error('Unexpected response format:', response);
      return [];
    }
    
    return plans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    // For debugging purposes, you might want to re-throw the error in development
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    return [];
  }
};

/**
 * Fetches available durations for a specific subscription plan
 * @param planId - The ID of the subscription plan
 */
export const fetchPlanDurations = async (planId: number): Promise<PlanDuration[]> => {
  if (!planId) return [];
  
  try {
    // The endpoint is /api/v1/subscription/plans/{plan_id}/durations/ as per backend URL configuration
    const response = await apiGet<{ results: PlanDuration[] } | PlanDuration[]>(
      `${API_BASE}/plans/${planId}/durations/`
    );
    
    // Handle paginated response (response.results) or direct array response
    const durations = Array.isArray(response) ? response : (response?.results || []);
    return Array.isArray(durations) ? durations : [];
  } catch (error) {
    console.error(`Error fetching durations for plan ${planId}:`, error);
    return [];
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
const formatPrice = (price: number | string): string => {
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
  const months = duration.duration_months;
  const price = formatPrice(duration.price);
  
  if (duration.discount_percentage > 0) {
    const priceNumber = typeof duration.price === 'string' ? parseFloat(duration.price) : duration.price;
    const originalPrice = formatPrice(priceNumber / (1 - (duration.discount_percentage / 100)));
    return `${months} months (${price} - ${duration.discount_percentage}% off, was ${originalPrice})`;
  }
  
  return `${months} months (${price})`;
};
