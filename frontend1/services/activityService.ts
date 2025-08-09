import { apiGet } from './apiService';

export interface UserDetails {
  id: string;
  username: string;
  email: string;
  full_name: string;
}

export interface Activity {
  id: string | number;
  user: string | null;
  user_details: UserDetails | null;
  activity_type: string;
  activity_type_display: string;
  object_type: string | null;
  object_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  user_agent: string | null;
  
  // Frontend-only fields
  title?: string;
  description?: string;
  timestamp?: string;
  type?: 'member' | 'project' | 'billing' | 'meeting' | 'system';
  user_name?: string;
}

export interface ActivityResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Activity[];
}

const mapActivityToFrontend = (activity: any): Activity => {
  // Map backend activity to frontend format
  const frontendActivity: Activity = {
    ...activity,
    // Ensure all required fields have proper defaults
    id: activity.id,
    user: activity.user || null,
    user_details: activity.user_details || null,
    activity_type: activity.activity_type || '',
    activity_type_display: activity.activity_type_display || 'Activity',
    object_type: activity.object_type || null,
    object_id: activity.object_id || null,
    details: activity.details || null,
    ip_address: activity.ip_address || null,
    created_at: activity.created_at || new Date().toISOString(),
    user_agent: activity.user_agent || null,
    
    // Frontend-specific fields
    title: activity.activity_type_display || 'Activity',
    description: activity.details?.message || 
      `${activity.object_type || 'Item'} ${activity.object_id ? `#${activity.object_id}` : ''} was ${activity.activity_type || 'updated'}`,
    timestamp: activity.created_at,
    user_name: activity.user_details?.full_name || activity.user_details?.username || 'System',
    
    // Map object_type to our UI types
    type: (() => {
      if (!activity.object_type) return 'system';
      if (activity.object_type === 'user') return 'member';
      if (['project', 'task'].includes(activity.object_type)) return 'project';
      if (['billing', 'invoice'].includes(activity.object_type)) return 'billing';
      if (['meeting', 'event'].includes(activity.object_type)) return 'meeting';
      return 'system';
    })()
  };

  return frontendActivity;
};

export const fetchRecentActivities = async (limit: number = 5): Promise<Activity[]> => {
  try {
    const response = await apiGet<ActivityResponse>(
      `/activities/?ordering=-created_at&limit=${limit}`
    );
    
    // Map the backend response to the frontend format
    return response.results.map(mapActivityToFrontend);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
};
