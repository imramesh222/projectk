import { apiGet } from '@/lib/api-client';

// Types for the organization metrics
export interface OrganizationMetrics {
  totalMembers: number;
  activeProjects: number;
  monthlyRevenue: number;
  teamProductivity: number;
  memberGrowth: number;
  projectCompletionRate: number;
}

export interface MemberActivity {
  month: string;
  active: number;
  new: number;
}

export interface ProjectStatus {
  name: string;
  value: number;
  color: string;
}

// API Response Types
interface ApiRecentActivity {
  type: 'user_signup' | 'project_update' | 'billing' | 'meeting';
  user: {
    id: string;
    email: string;
    name: string;
  };
  timestamp: string;
  message: string;
}

interface ApiDashboardResponse {
  metrics: {
    total_organizations: number;
    total_members: number;
    active_projects: number;
    monthly_revenue: number;
    team_productivity: number;
    member_growth: number;
    project_completion_rate: number;
  };
  member_activity: MemberActivity[];
  project_status: Array<{
    name: string;
    count: number;
    color?: string;
  }>;
  recent_activities: ApiRecentActivity[];
}

export interface RecentActivity {
  id: number;
  action: string;
  user: string;
  time: string;
  type: 'member' | 'project' | 'billing' | 'meeting';
}

// Fetch all dashboard data in a single request
export const fetchDashboardData = async () => {
  console.log('Fetching dashboard data...');
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      console.error('No authentication token found');
      throw new Error('Authentication required');
    }
    
    const endpoint = 'dashboard/superadmin/overview/';
    const response = await apiGet<ApiDashboardResponse>(endpoint);

    // Transform the response to match our frontend types
    return {
      metrics: {
        totalMembers: response.metrics.total_members,
        activeProjects: response.metrics.active_projects,
        monthlyRevenue: response.metrics.monthly_revenue,
        teamProductivity: response.metrics.team_productivity,
        memberGrowth: response.metrics.member_growth,
        projectCompletionRate: response.metrics.project_completion_rate
      },
      memberActivity: response.member_activity,
      projectStatus: response.project_status.map(status => ({
        name: status.name,
        value: status.count,
        color: status.color || getStatusColor(status.name)
      })),
      recentActivities: response.recent_activities.map(activity => {
        let activityType: 'member' | 'project' | 'billing' | 'meeting';
        
        switch (activity.type) {
          case 'user_signup':
            activityType = 'member';
            break;
          case 'project_update':
            activityType = 'project';
            break;
          case 'billing':
          case 'meeting':
            activityType = activity.type;
            break;
          default:
            activityType = 'member'; // Default fallback
        }
        
        return {
          id: parseInt(activity.user.id, 10) || 0,
          action: activity.message,
          user: activity.user.name,
          time: activity.timestamp,
          type: activityType
        };
      })
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Individual fetch functions that use the combined endpoint
// These are kept for backward compatibility

export const fetchOrganizationMetrics = async (): Promise<OrganizationMetrics> => {
  const data = await fetchDashboardData();
  return data.metrics;
};

export const fetchMemberActivity = async (): Promise<MemberActivity[]> => {
  const data = await fetchDashboardData();
  return data.memberActivity;
};

export const fetchProjectStatus = async (): Promise<ProjectStatus[]> => {
  const data = await fetchDashboardData();
  return data.projectStatus;
};

export const fetchRecentActivities = async (): Promise<RecentActivity[]> => {
  const data = await fetchDashboardData();
  return data.recentActivities;
};

// Helper function to get color based on status (for project status)
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'Completed': '#10B981',
    'In Progress': '#3B82F6',
    'Planning': '#F59E0B',
    'On Hold': '#EF4444',
    'Not Started': '#6B7280'
  };
  return colors[status] || '#6B7280';
};
