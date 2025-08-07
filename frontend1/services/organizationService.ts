import { apiGet } from './apiService';
import { 
  Organization, 
  OrganizationListItem as OrgListItem,
  OrganizationMember, 
  OrganizationMetrics, 
  OrganizationDashboardData,
  OrganizationActivity,
  OrganizationProject,
  OrganizationRole,
  OrganizationStatus,
  BillingPlan
} from '@/types/organization';

// Re-export the type with a consistent name
export type OrganizationListItem = OrgListItem;

// Type for the superadmin dashboard response
interface SuperadminDashboardResponse {
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
    status: string;
    count: number;
    color?: string;
  }>;
  recent_activities: Array<{
    id: number;
    action: string;
    user: string;
    time: string;
    type: string;
  }>;
}

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
  return {
    ...response,
    status: (response.status as OrganizationStatus) || OrganizationStatus.INACTIVE,
    plan: (response.plan as BillingPlan) || BillingPlan.FREE,
  };
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
const mapDashboardResponse = (response: any): OrganizationDashboardData => {
  if (!response) {
    throw new Error('Invalid dashboard response');
  }

  const { 
    metrics = {}, 
    recent_activities = [], 
    member_activity = [],
    project_status = []
  } = response;

  // Map member activity with null checks
  const memberActivity: MemberActivity[] = (member_activity || []).map((activity: any) => ({
    date: activity?.date || new Date().toISOString(),
    active: activity?.active || 0,
    new: activity?.new || 0
  }));

  // Map project status with null checks
  const projectStatus = (project_status || []).map((status: any) => ({
    status: status?.status || 'unknown',
    count: status?.count || 0,
    color: status?.color || getStatusColor(status?.status || 'unknown')
  }));

  const dashboardMetrics: OrganizationMetrics = {
    totalMembers: metrics?.total_members || 0,
    activeMembers: metrics?.active_members || 0,
    totalProjects: metrics?.total_projects || 0,
    activeProjects: metrics?.active_projects || 0,
    pendingTasks: metrics?.pending_tasks || 0,
    completedTasks: metrics?.completed_tasks || 0,
    monthlyRevenue: metrics?.monthly_revenue || 0,
    totalRevenue: 0, // Not provided in backend response
    pendingInvoices: metrics?.pending_invoices || 0,
    overdueInvoices: metrics?.overdue_invoices || 0,
    storageUsage: metrics?.storage_usage || 0,
    storageLimit: metrics?.storage_limit || 0,
    memberActivity,
    projectStatus,
    teamProductivity: 0, // Not provided in backend response
    memberGrowth: 0, // Not provided in backend response
    projectCompletionRate: 0 // Not provided in backend response
  };

  // Map recent activities with null checks and proper typing
  const recentActivities: OrganizationActivity[] = (recent_activities || []).map((activity: any) => {
    // Ensure type is one of the allowed ActivityType values
    const activityType = (['member', 'project', 'billing', 'meeting', 'system', 'task', 'milestone'] as const)
      .includes(activity?.type as any)
      ? activity.type as ActivityType
      : 'system';
      
    return {
      id: activity?.id?.toString() || '',
      type: activityType,
      action: activity?.action || '',
      timestamp: activity?.timestamp || new Date().toISOString(),
      user_name: activity?.user_name || 'System',
      user_email: activity?.user_email || ''
    };
  });

  // Return the mapped dashboard data with default values for missing fields
  const dashboardData: OrganizationDashboardData = {
    metrics: dashboardMetrics,
    recentActivities,
    projects: [], // Not provided in backend response
    upcomingDeadlines: [], // Not provided in backend response
    teamMembers: [] // Not provided in backend response
  };

  return dashboardData;
};

// Fetch all dashboard data for organization admin
export const fetchOrganizationAdminDashboard = async (orgId: string): Promise<OrganizationDashboardData> => {
  try {
    // Use the correct endpoint for organization admin dashboard
    const response = await apiGet<any>('/org/dashboard/admin/overview/');
    
    // The response should be the data object directly
    const data = response.data || response;
    
    // Map the response to the expected format
    const mappedData = {
      metrics: {
        ...data.metrics,
        // Map any additional metrics that might be in a different format
        totalMembers: data.metrics?.total_members || 0,
        activeMembers: data.metrics?.active_members || 0,
        totalProjects: data.metrics?.total_projects || 0,
        activeProjects: data.metrics?.active_projects || 0,
        monthlyRevenue: data.metrics?.monthly_revenue || 0,
        teamProductivity: data.metrics?.team_productivity || 0,
        memberGrowth: data.metrics?.member_growth || 0,
        projectCompletionRate: data.metrics?.project_completion_rate || 0,
        // Add any other metrics that might be needed
      },
      recent_activities: data.recent_activities || [],
      member_activity: data.member_activity || [],
      project_status: data.project_status || [],
      // Add any other data that might be needed
    };
    
    return mapDashboardResponse(mappedData);
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
      teamMembers: []
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
// Define a type for the API response to avoid circular references
interface OrganizationApiResponse extends Omit<Organization, 'data'> {
  // Add any additional fields that might come from the API
  [key: string]: any;
}

export const fetchOrganizationDetails = async (orgId: string): Promise<Organization> => {
  try {
    const response = await apiGet<OrganizationApiResponse>(`/org/organizations/${orgId}/`);
    const orgData = response.data;
    
    // Create the organization object with proper typing
    const organization: Organization = {
      ...orgData,
      status: orgData.status || OrganizationStatus.INACTIVE,
      plan: orgData.plan || BillingPlan.FREE,
      member_count: orgData.member_count || 0,
      storage_used: orgData.storage_used || 0,
      storage_limit: orgData.storage_limit || 0,
      last_active: orgData.last_active || new Date().toISOString(),
      owner: orgData.owner || '',
      updated_at: orgData.updated_at || new Date().toISOString(),
      // Set data to a copy of the org data without the data property to avoid circular references
      data: Object.fromEntries(
        Object.entries(orgData).filter(([key]) => key !== 'data')
      ) as any
    };
    
    return organization;
  } catch (error) {
    console.error('Error fetching organization details:', error);
    // Return a minimal organization object to prevent UI crashes
    const now = new Date().toISOString();
    return {
      id: orgId,
      name: 'Unknown Organization',
      slug: 'unknown',
      is_active: true,
      created_at: now,
      updated_at: now,
      members_count: 0,
      projects_count: 0,
      status: OrganizationStatus.INACTIVE,
      plan: BillingPlan.FREE,
      member_count: 0,
      storage_used: 0,
      storage_limit: 0,
      last_active: new Date().toISOString(),
      owner: '',
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
    status: member.status,
    currentTask: member.current_task ? {
      id: member.current_task.id,
      title: member.current_task.title,
      projectId: member.current_task.project_id,
      projectName: member.current_task.project_name
    } : undefined
  }));
};

/**
 * Fetches dashboard data for superadmin
 */
/**
 * Fetches a list of organizations with optional pagination and filtering
 */
export const fetchOrganizations = async ({
  page = 1,
  pageSize = 10,
  search = '',
  status = '',
  sortBy = 'name',
  sortOrder = 'asc'
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<{
  organizations: Organization[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ordering: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`,
    });

    const response = await apiGet<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Array<{
        id: string;
        name: string;
        status: string;
        plan: string;
        member_count: number;
        storage_used: number;
        storage_limit: number;
        last_active: string;
        owner: string;
        created_at: string;
        updated_at: string;
        is_active: boolean;
        slug: string;
      }>;
    }>(`/org/organizations/?${params.toString()}`);

    // Define the API response organization type
    interface ApiOrganization {
      id: string;
      name: string;
      slug?: string;
      status?: string;
      plan?: string;
      member_count?: number;
      storage_used?: number;
      storage_limit?: number;
      last_active?: string;
      owner?: string;
      created_at?: string;
      updated_at?: string;
      is_active?: boolean;
      members_count?: number;
      projects_count?: number;
    }

    // Map the API response to the Organization type
    const organizations: Organization[] = response.results.map((org: ApiOrganization) => {
      // Create a new object with all the required fields
      const organization: Organization = {
        id: org.id,
        name: org.name,
        slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
        is_active: org.is_active !== undefined ? org.is_active : true,
        created_at: org.created_at || new Date().toISOString(),
        updated_at: org.updated_at || new Date().toISOString(),
        // These properties come from the API response but might be undefined
        members_count: 'members_count' in org ? org.members_count : 0,
        projects_count: 'projects_count' in org ? org.projects_count : 0,
        status: (org.status as OrganizationStatus) || OrganizationStatus.INACTIVE,
        plan: (org.plan as BillingPlan) || BillingPlan.FREE,
        member_count: org.member_count || 0,
        storage_used: org.storage_used || 0,
        storage_limit: org.storage_limit || 0,
        last_active: org.last_active || new Date().toISOString(),
        owner: org.owner || '',
        // Set data to a copy of the org data without the data property
        data: {
          id: org.id,
          name: org.name,
          slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
          is_active: org.is_active !== undefined ? org.is_active : true,
          created_at: org.created_at || new Date().toISOString(),
          updated_at: org.updated_at || new Date().toISOString(),
          status: (org.status as OrganizationStatus) || OrganizationStatus.INACTIVE,
          plan: (org.plan as BillingPlan) || BillingPlan.FREE,
          member_count: org.member_count || 0,
          storage_used: org.storage_used || 0,
          storage_limit: org.storage_limit || 0,
          last_active: org.last_active || new Date().toISOString(),
          owner: org.owner || ''
        }
      };
      
      return organization;
    });

    return {
      organizations,
      total: response.count,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(response.count / pageSize),
    };
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

export const fetchDashboardData = async (): Promise<OrganizationDashboardData> => {
  try {
    console.log('Fetching superadmin dashboard data...');
    const response = await apiGet<SuperadminDashboardResponse>('/org/dashboard/metrics/');
    console.log('Raw dashboard response:', response);
    
    // Use the response directly as it's already typed as SuperadminDashboardResponse
    const data = response;
    
    // Map member activity
    const memberActivity: MemberActivity[] = (data.member_activity || []).map((item: { month: string; active?: number; new?: number }) => ({
      date: item.month,
      active: item.active || 0,
      new: item.new || 0
    }));
    
    // Map project status
    const projectStatus = (data.project_status || []).map((item: { status: string; count?: number; color?: string }) => ({
      status: item.status,
      count: item.count || 0,
      color: item.color || getStatusColor(item.status)
    }));
    
    // Map recent activities
    const recentActivities: OrganizationActivity[] = (data.recent_activities || []).map(activity => {
      // Ensure the activity has a valid type
      const activityType: ActivityType = 
        activity.type && ['member', 'project', 'billing', 'meeting', 'system'].includes(activity.type)
          ? activity.type as ActivityType
          : 'system';
          
      return {
        id: activity.id.toString(),
        type: activityType,
        action: activity.action,
        timestamp: new Date().toISOString(),
        user_name: activity.user,
        time: activity.time
      };
    });
    
    // Create the dashboard data object
    const dashboardData: OrganizationDashboardData = {
      metrics: {
        totalMembers: data.metrics?.total_members || 0,
        activeMembers: 0, // Not provided in superadmin metrics
        totalProjects: data.metrics?.active_projects || 0,
        activeProjects: data.metrics?.active_projects || 0,
        pendingTasks: 0, // Not provided in superadmin metrics
        completedTasks: 0, // Not provided in superadmin metrics
        monthlyRevenue: data.metrics?.monthly_revenue || 0,
        totalRevenue: 0, // Not provided in superadmin metrics
        pendingInvoices: 0, // Not provided in superadmin metrics
        overdueInvoices: 0, // Not provided in superadmin metrics
        storageUsage: 0, // Not provided in superadmin metrics
        storageLimit: 0, // Not provided in superadmin metrics
        teamProductivity: data.metrics?.team_productivity || 0,
        memberGrowth: data.metrics?.member_growth || 0,
        projectCompletionRate: data.metrics?.project_completion_rate || 0,
        memberActivity,
        projectStatus
      },
      recentActivities,
      projects: [], // Not provided in superadmin dashboard
      upcomingDeadlines: [], // Not provided in superadmin dashboard
      teamMembers: [] // Not provided in superadmin dashboard
    };
    
    console.log('Mapped dashboard data:', dashboardData);
    return dashboardData;
  } catch (error) {
    console.error('Error fetching superadmin dashboard data:', error);
    
    // Return default data structure on error
    return {
      metrics: {
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
        teamProductivity: 0,
        memberGrowth: 0,
        projectCompletionRate: 0,
        memberActivity: [],
        projectStatus: []
      },
      recentActivities: [],
      projects: [],
      upcomingDeadlines: [],
      teamMembers: []
    };
  }
};
