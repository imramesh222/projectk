export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  lastActive?: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  storageUsed: number;
  storageTotal: number;
  revenue: number;
  revenueChange: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksOverdue: number;
  totalMembers?: number;
  completedTasks?: number;
  monthlyRevenue?: number;
}

export interface ActivityItem {
  id: string;
  type: 'user' | 'project' | 'task' | 'system';
  action: string;
  user: string;
  timestamp: string;
  project?: string;
  task?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  project: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface ProjectItem {
  id: string;
  name: string;
  status: 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  progress: number;
  members: number;
  dueDate: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentActivity: ActivityItem[];
  upcomingTasks?: TaskItem[];
  recentProjects?: ProjectItem[];
  storageUsage: {
    used: number;
    total: number;
  };
  updatedAt: string;
}
