import { apiGet } from './apiService';
import { 
  Organization, 
  OrganizationMember, 
  OrganizationMetrics, 
  OrganizationDashboardData,
  OrganizationActivity,
  OrganizationProject,
  OrganizationRole
} from '@/types/organization';

// Project status type is now imported from OrganizationProject

// Define valid status types
type StatusType = 'active' | 'pending' | 'completed' | 'cancelled' | 'on_hold' | 
  'in_progress' | 'planning' | 'overdue' | 'draft' | 'published' | 'archived';

// Define project status type for organization dashboard
type OrgProjectStatus = {
  status: string;
  count: number;
  color: string;
};

// Activity types for recent activities
type ActivityType = 'member' | 'project' | 'billing' | 'meeting' | 'system';

// Define interface for member activity item
interface MemberActivityItem {
  date?: string;
  active?: number;
  new?: number;
}

// Define interface for recent activity item
interface RecentActivityItem {
  id?: string;
  type?: string;
  action?: string;
  timestamp?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  target_id?: string;
  target_type?: string;
  metadata?: Record<string, any>;
}

export const getOrganizationById = async (orgId: string): Promise<Organization> => {
  const response = await apiGet<Organization>(`/org/organizations/${orgId}/`);
  return response;
};

interface ApiDashboardResponse {
  metrics: ApiDashboardMetrics & {
    member_activity?: Array<{
      date: string;
      active: number;
      new: number;
    }>;
    project_status?: Array<{
      status: string;
      count: number;
      color?: string;
    }>;
  };
  recent_activities?: ApiRecentActivity[];
  projects?: ApiProject[];
  upcoming_deadlines?: ApiDeadline[];
  team_members?: ApiTeamMember[];
}

interface ApiProject {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  start_date: string;
  due_date: string;
  members: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }>;
  budget: number;
  spent: number;
}

interface ApiDeadline {
  id: string;
  title: string;
  due_date: string;
  project_id: string;
  project_name: string;
  type: string;
  status: string;
}

interface ApiTeamMember {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  avatar?: string;
  last_active: string;
  status: 'online' | 'offline' | 'away' | 'busy' | 'inactive';
  current_task?: {
    id: string;
    title: string;
    project_id: string;
    project_name: string;
  };
}

// Re-export types from the organization types file
export type { OrganizationDashboardData, OrganizationMetrics } from '@/types/organization';

// Local interfaces that extend the base types

export interface MemberActivity {
  date: string;  
  active: number;
  new: number;
}

interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

// API Response Types
interface ApiRecentActivity {
  id: string;
  type: ActivityType;
  action: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  target_id?: string;
  target_type?: string;
  timestamp: string;
  metadata?: Record<string, any>;
  // For backward compatibility
  user?: string | { id: string; name: string; email: string };
  time?: string;
  message?: string;
}

// Type guards for user property
function isUserObject(user: string | { id: string; name: string; email: string } | undefined): user is { id: string; name: string; email: string } {
  return typeof user === 'object' && user !== null && 'id' in user && 'name' in user && 'email' in user;
}

interface ApiDashboardMetrics {
  // Core metrics
  total_members: number;
  active_members: number;
  total_projects: number;
  active_projects: number;
  pending_tasks: number;
  completed_tasks: number;
  monthly_revenue: number;
  total_revenue: number;
  
  // Additional metrics
  pending_invoices: number;
  overdue_invoices: number;
  storage_usage: number;
  storage_limit: number;
  team_productivity: number;
  member_growth: number;
  project_completion_rate: number;
  
  // Data collections
  member_activity?: Array<{
    date: string;
    active: number;
    new: number;
  }>;
  
  project_status?: Array<{
    status: string;
    count: number;
    color?: string;
  }>;
  
  recent_activities?: ApiRecentActivity[];
}

// Local interfaces that extend the base types
export interface ExtendedOrganizationMetrics {
  // Core metrics from OrganizationMetrics
  totalMembers: number;
  activeMembers: number;
  totalProjects: number;
  activeProjects: number;
  pendingTasks: number;
  completedTasks: number;
  monthlyRevenue: number;
  totalRevenue: number;
  
  // Additional metrics
  pendingInvoices: number;
  overdueInvoices: number;
  storageUsage: number;
  storageLimit: number;
  teamProductivity: number;
  memberGrowth: number;
  projectCompletionRate: number;
  
  // Data collections with proper typing
  projectStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  
  memberActivity: Array<{
    date: string;
    active: number;
    new: number;
  }>;
  
  recentActivities: Array<{
    id: string;
    type: string;
    action: string;
    timestamp: string;
    user_name: string;
    user_email?: string;
  }>;
}

export interface ExtendedOrganizationDashboardData {
  metrics: ExtendedOrganizationMetrics;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    progress: number;
    startDate: string;
    dueDate: string;
    members: Array<{
      id: string;
      name: string;
      role: string;
      avatar?: string;
    }>;
    budget: number;
    spent: number;
  }>;
  
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    projectId: string;
    projectName: string;
    type: string;
    status: string;
  }>;
  
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: OrganizationRole;
    avatar?: string;
    lastActive: string;
    status: 'online' | 'offline' | 'away' | 'busy' | 'inactive';
    currentTask?: {
      id: string;
      title: string;
      projectId: string;
      projectName: string;
    };
  }>;
  
  memberActivity: Array<{
    date: string;
    active: number;
    new: number;
  }>;
  
  recentActivities: Array<{
    id: string;
    type: string;
    action: string;
    timestamp: string;
    user_name: string;
    user_email?: string;
  }>;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  dueDate: string;
  members: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }>;
  budget: number;
  spent: number;
}

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  projectId: string;
  projectName: string;
  type: string;
  status: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  avatar?: string;
  lastActive: string;
  status: 'online' | 'offline' | 'away' | 'busy' | 'inactive';
  currentTask?: {
    id: string;
    title: string;
    projectId: string;
    projectName: string;
  };
}

// Helper function to get status color based on status
const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: '#10B981',
    completed: '#3B82F6',
    pending: '#F59E0B',
    cancelled: '#EF4444',
    on_hold: '#6B7280',
    in_progress: '#6366F1',
    planning: '#8B5CF6',
    overdue: '#EC4899',
    draft: '#9CA3AF',
    published: '#10B981',
    archived: '#6B7280',
    // Add any additional status colors here
  };
  return statusColors[status] || '#6B7280';
};

// Helper function to map API response to OrganizationDashboardData
const mapDashboardResponse = (response: ApiDashboardResponse): OrganizationDashboardData => {
  if (!response?.metrics) {
    throw new Error('Invalid dashboard response');
  }

  const { 
    metrics, 
    recent_activities = [], 
    projects = [], 
    upcoming_deadlines = [], 
    team_members = [] 
  } = response;

  // Map metrics with null checks
  const safeMetrics = metrics || {};
  // Map member activity with null checks
  const memberActivity = (safeMetrics.member_activity || []).map(activity => ({
    date: activity?.date || new Date().toISOString(),
    active: activity?.active || 0,
    new: activity?.new || 0
  }));

  // Map project status with null checks
  const projectStatus = (safeMetrics.project_status || []).map(status => ({
    status: status?.status || 'unknown',
    count: status?.count || 0,
    color: status?.color || getStatusColor(status?.status || 'unknown')
  }));

  const dashboardMetrics: OrganizationMetrics = {
    totalMembers: safeMetrics.total_members || 0,
    activeMembers: safeMetrics.active_members || 0,
    totalProjects: safeMetrics.total_projects || 0,
    activeProjects: safeMetrics.active_projects || 0,
    pendingTasks: safeMetrics.pending_tasks || 0,
    completedTasks: safeMetrics.completed_tasks || 0,
    monthlyRevenue: safeMetrics.monthly_revenue || 0,
    totalRevenue: safeMetrics.total_revenue || 0,
    pendingInvoices: safeMetrics.pending_invoices || 0,
    overdueInvoices: safeMetrics.overdue_invoices || 0,
    storageUsage: safeMetrics.storage_usage || 0,
    storageLimit: safeMetrics.storage_limit || 0,
    memberActivity,
    projectStatus
  };

  // Map recent activities with null checks and proper typing
  const recentActivities: OrganizationActivity[] = (recent_activities || []).map(activity => {
    // Ensure type is one of the allowed ActivityType values
    const activityType = (['member', 'project', 'billing', 'meeting', 'system'] as const)
      .includes(activity?.type as any)
      ? activity.type as ActivityType
      : 'system';
      
    return {
      id: activity?.id || '',
      type: activityType,
      action: activity?.action || '',
      timestamp: activity?.timestamp || new Date().toISOString(),
      user_name: activity?.user_name || 'System',
      user_email: activity?.user_email || ''
    };
  });

  // Map projects with null checks and proper type casting
  const mappedProjects: OrganizationProject[] = (projects || []).map(project => {
    // Safely handle project status with type checking
    const status: OrganizationProject['status'] = project?.status && 
      ['completed', 'cancelled', 'on_hold', 'in_progress', 'planning'].includes(project.status)
        ? project.status as OrganizationProject['status']
        : 'planning';

    // Map project members with proper typing
    const projectMembers = (project?.members || []).map(member => ({
      id: member?.id || '',
      name: member?.name || 'Unknown Member',
      role: (member?.role as OrganizationRole) || 'member',
      avatar: member?.avatar || undefined
    }));

    // Return the properly typed project object
    return {
      id: project?.id || '',
      name: project?.name || 'Unnamed Project',
      description: project?.description || '',
      status,
      progress: project?.progress || 0,
      startDate: project?.start_date || '',
      dueDate: project?.due_date || '',
      members: projectMembers,
      budget: project?.budget || 0,
      spent: project?.spent || 0
    };
  });

  // Map upcoming deadlines with null checks
  const upcomingDeadlines = (upcoming_deadlines || []).map(deadline => ({
    id: deadline?.id || '',
    title: deadline?.title || 'Untitled Deadline',
    dueDate: deadline?.due_date || '',
    projectId: deadline?.project_id || '',
    projectName: deadline?.project_name || 'Unknown Project',
    type: (deadline?.type as any) || 'task',
    status: (deadline?.status as any) || 'pending'
  }));

  // Map team members with null checks
  const teamMembers = (team_members || []).map(member => ({
    id: member?.id || '',
    name: member?.name || 'Unknown User',
    email: member?.email || '',
    role: member?.role || 'member',
    avatar: member?.avatar,
    lastActive: member?.last_active || new Date().toISOString(),
    status: (['online', 'offline', 'away'].includes(member?.status || '') 
      ? member?.status 
      : 'offline') as 'online' | 'offline' | 'away',
    currentTask: member?.current_task ? {
      id: member.current_task.id || '',
      title: member.current_task.title || '',
      projectId: member.current_task.project_id || '',
      projectName: member.current_task.project_name || ''
    } : undefined
  }));

  // Return the mapped dashboard data
  const dashboardData: OrganizationDashboardData = {
    metrics: dashboardMetrics,
    recentActivities,
    projects: mappedProjects,
    upcomingDeadlines,
    teamMembers
  };

  return dashboardData;
};

// Fetch all dashboard data for organization admin
export const fetchOrganizationAdminDashboard = async (orgId: string): Promise<OrganizationDashboardData> => {
  try {
    const response = await apiGet<ApiDashboardResponse>(`/dashboard/organization/${orgId}/`);
    return mapDashboardResponse(response);
  } catch (error) {
    console.error('Error fetching organization dashboard data:', error);
    // Return a default dashboard data structure on error to prevent UI crashes
    const defaultMetrics: OrganizationMetrics = {
      totalMembers: 0,
      activeMembers: 0,
      totalProjects: 0,
      activeProjects: 0,
      pendingTasks: 0,
      completedTasks: 0,
      monthlyRevenue: 0,
      totalRevenue: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      storageUsage: 0,
      storageLimit: 0,
      memberActivity: [],
      projectStatus: []
    };

    return {
      metrics: defaultMetrics,
      recentActivities: [],
      projects: [],
      upcomingDeadlines: [],
      teamMembers: [] // Add the missing teamMembers property
    };
  }
};

// Helper function to map recent activities with proper typing
const mapRecentActivities = (activities: ApiRecentActivity[] = []): OrganizationActivity[] => {
  if (!activities || !Array.isArray(activities)) {
    return [];
  }
  
  return activities.map(activity => {
    if (!activity) return null;
    
    const activityType = (['member', 'project', 'billing', 'meeting', 'system'] as const)
      .includes(activity.type as any) 
      ? activity.type as ActivityType
      : 'system';
    
    return {
      id: activity.id || `activity-${Math.random().toString(36).substr(2, 9)}`,
      type: activityType,
      action: activity.action || 'Unknown action',
      timestamp: activity.timestamp || new Date().toISOString(),
      userId: activity.user_id,
      userName: activity.user_name || 'System',
      userEmail: activity.user_email,
      targetId: activity.target_id,
      targetType: activity.target_type as any,
      ...(activity.metadata && { metadata: activity.metadata })
    };
  }).filter(Boolean) as OrganizationActivity[]; // Filter out any null entries
};
/**
 * Fetches organization details by ID
 */
export const fetchOrganizationDetails = async (orgId: string): Promise<Organization> => {
  try {
    const response = await apiGet<Organization>(`/organizations/${orgId}/`);
    return response;
  } catch (error) {
    console.error('Error fetching organization details:', error);
    // Return a minimal organization object to prevent UI crashes
    return {
      id: orgId,
      name: 'Organization',
      slug: 'organization',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

/**
 * Fetches organization metrics
 */
export const fetchOrganizationMetrics = async (orgId: string): Promise<OrganizationMetrics> => {
  try {
    const response = await apiGet<{ metrics: OrganizationMetrics }>(`/organizations/${orgId}/metrics/`);
    return response.metrics;
  } catch (error) {
    console.error('Error fetching organization metrics:', error);
    throw error;
  }
};

/**
 * Helper function to map team members with proper typing
 */
const mapTeamMembers = (members: ApiTeamMember[] = []): TeamMember[] => {
  return members.map(member => ({
    id: member.id || '',
    name: member.name || 'Unknown Member',
    email: member.email || '',
    role: (member.role || 'member') as OrganizationRole,
    avatar: member.avatar,
    lastActive: member.last_active || new Date().toISOString(),
    status: (['online', 'offline', 'away', 'busy', 'inactive'].includes(member.status) 
      ? member.status 
      : 'inactive') as 'online' | 'offline' | 'away' | 'busy' | 'inactive',
    ...(member.current_task && {
      currentTask: {
        id: member.current_task.id,
        title: member.current_task.title,
        projectId: member.current_task.project_id,
        projectName: member.current_task.project_name
      }
    })
  }));
};
