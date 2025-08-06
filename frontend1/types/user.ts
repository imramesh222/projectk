export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  role: 'superadmin' | 'admin' | 'user' | 'guest';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
  organizationName?: string;
  organizationRole?: string;
  permissions?: string[];
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
  defaultProjectView: 'list' | 'board' | 'calendar';
  itemsPerPage: number;
  compactMode: boolean;
  keyboardShortcuts: boolean;
}

export interface UserSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalHoursWorked: number;
  weeklyHours: Array<{
    date: string;
    hours: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface UserFilter {
  role?: string[];
  status?: ('active' | 'inactive' | 'suspended')[];
  search?: string;
  organizationId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
