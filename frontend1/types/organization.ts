export enum OrganizationRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  PROJECT_MANAGER = 'project_manager',
  DEVELOPER = 'developer',
  SUPPORT = 'support',
  VERIFIER = 'verifier',
  SALESPERSON = 'salesperson',
  CLIENT = 'client',
}

export interface OrganizationMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: OrganizationRole;
  joinedAt: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface OrganizationProject {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
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

export interface OrganizationActivity {
  id: string;
  type: 'member' | 'project' | 'billing' | 'meeting' | 'system';
  action: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  targetId?: string;
  targetType?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface OrganizationMetrics {
  totalMembers: number;
  activeMembers: number;
  totalProjects: number;
  activeProjects: number;
  pendingTasks: number;
  completedTasks: number;
  monthlyRevenue: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  storageUsage: number;
  storageLimit: number;
  memberActivity: Array<{
    date: string;
    active: number;
    new: number;
  }>;
  projectStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  members_count?: number;
  projects_count?: number;
}

export interface OrganizationDashboardData {
  metrics: OrganizationMetrics;
  recentActivities: OrganizationActivity[];
  projects: OrganizationProject[];
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    projectId: string;
    projectName: string;
    type: 'task' | 'milestone' | 'deliverable' | 'payment';
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: OrganizationRole;
    avatar?: string;
    lastActive: string;
    status: 'online' | 'offline' | 'away';
    currentTask?: {
      id: string;
      title: string;
      projectId: string;
      projectName: string;
    };
  }>;
}
