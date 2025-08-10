import { apiGet } from './apiService';
import { format, subDays } from 'date-fns';

// Types for dashboard data
export interface DashboardMetrics {
  total_members: number;
  active_members: number;
  monthly_revenue: number;
  tasks_completed: number;
  team_performance: number;
  active_projects: number;
  member_growth: number;
  revenue_change: number;
  task_completion_rate: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface ProjectItem {
  id: string;
  name: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;
  members_count: number;
  deadline: string;
  start_date: string;
  status_color: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  recent_activities: ActivityItem[];
  active_projects: ProjectItem[];
  // Will add more types for charts and other data
}

/**
 * Fetches dashboard data for the organization
 * @param isSuperAdmin Whether the current user is a superadmin
 */
export const fetchDashboardData = async (isSuperAdmin: boolean = false): Promise<DashboardData> => {
  try {
    // Use the appropriate endpoint based on user role
    const endpoint = isSuperAdmin 
      ? '/dashboard/metrics/'  // Superadmin dashboard
      : '/dashboard/admin/overview/';  // Organization admin dashboard
    
    // Fetch real data from the backend API
    const response = await apiGet<DashboardData>(endpoint);
    
    // Transform the response to match our interface if needed
    const data: DashboardData = {
      metrics: {
        total_members: response.metrics?.total_members || 0,
        active_members: response.metrics?.active_members || 0,
        monthly_revenue: response.metrics?.monthly_revenue || 0,
        tasks_completed: response.metrics?.tasks_completed || 0,
        team_performance: response.metrics?.team_performance || 0,
        active_projects: response.metrics?.active_projects || 0,
        member_growth: response.metrics?.member_growth || 0,
        revenue_change: response.metrics?.revenue_change || 0,
        task_completion_rate: response.metrics?.task_completion_rate || 0
      },
      recent_activities: (response.recent_activities || []).map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        type: (activity.type as 'info' | 'success' | 'warning' | 'error') || 'info',
        ...(activity.user && {
          user: {
            id: activity.user.id,
            name: activity.user.name,
            ...(activity.user.avatar && { avatar: activity.user.avatar })
          }
        })
      })),
      active_projects: (response.active_projects || []).map(project => ({
        id: project.id,
        name: project.name,
        status: (project.status as 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled') || 'planning',
        progress: project.progress || 0,
        members_count: project.members_count || 0,
        deadline: project.deadline,
        start_date: project.start_date,
        status_color: project.status_color || 'bg-gray-100 text-gray-800'
      }))
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return empty data structure in case of error
    return {
      metrics: {
        total_members: 0,
        active_members: 0,
        monthly_revenue: 0,
        tasks_completed: 0,
        team_performance: 0,
        active_projects: 0,
        member_growth: 0,
        revenue_change: 0,
        task_completion_rate: 0
      },
      recent_activities: [],
      active_projects: []
    };
  }
};

/**
 * Fetches chart data for the dashboard
 * @param range Time range for the data (e.g., '7d', '30d', '90d')
 */
export const fetchChartData = async (range: string = '30d') => {
  try {
    // In a real app, this would be an API call like:
    // return await apiGet(`/api/dashboard/charts?range=${range}`);
    
    // Mock data for charts
    const now = new Date();
    const days = parseInt(range);
    const labels = Array.from({ length: days }, (_, i) => 
      format(subDays(now, days - i - 1), 'MMM dd')
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'Active Users',
          data: Array.from({ length: days }, () => Math.floor(Math.random() * 100) + 50),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: 'Tasks Completed',
          data: Array.from({ length: days }, () => Math.floor(Math.random() * 50) + 20),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching chart data:', error);
    throw error;
  }
};
