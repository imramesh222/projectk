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
    const endpoint = 'org/dashboard/metrics';
    console.log('Making request to:', endpoint);
    const response = await apiGet<{
      metrics: {
        total_organizations: number;
        total_members: number;
        active_projects: number;
        monthly_revenue: number;
        team_productivity: number;
        member_growth: number;
        project_completion_rate: number;
      };
      member_activity: Array<{
        month: string;
        active: number;
        new: number;
      }>;
      project_status: Array<{
        name: string;
        count: number;
        color?: string;
      }>;
      recent_activities: Array<{
        id: number;
        action: string;
        user: string;
        time: string;
        type: 'member' | 'project' | 'billing' | 'meeting';
      }>;
    }>('org/dashboard/metrics');

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
      recentActivities: response.recent_activities
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
