export type TaskStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'in_review' 
  | 'completed' 
  | 'blocked' 
  | 'deferred';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  completedAt?: string;
  projectId: string;
  projectName: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  reporterId: string;
  reporterName: string;
  estimatedHours?: number;
  loggedHours?: number;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  notStarted: number;
  inProgress: number;
  inReview: number;
  completed: number;
  blocked: number;
  overdue: number;
  dueThisWeek: number;
  completedThisWeek: number;
  createdThisWeek: number;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: Array<'low' | 'medium' | 'high' | 'urgent'>;
  assigneeId?: string;
  reporterId?: string;
  projectId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  labels?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
