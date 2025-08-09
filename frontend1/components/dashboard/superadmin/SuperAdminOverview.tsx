'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Cpu, 
  Database, 
  DollarSign,
  FolderPlus, 
  HardDrive,
  Loader2, 
  RefreshCw, 
  Server, 
  Shield, 
  User, 
  UserPlus, 
  Users, 
  XCircle,
  AlertCircle,
  FolderOpen
} from 'lucide-react';

// Import services and types
import { fetchDashboardData, fetchOrganizationMetrics } from '@/services/organizationService';
import { fetchRecentActivities } from '@/services/activityService';

// Import the Activity type with an alias to avoid conflict with the Activity icon
import type { Activity as ActivityType } from '@/services/activityService';

// Define a new type for the UI that matches our needs
interface ExtendedActivity {
  id: string;
  type: 'member' | 'project' | 'billing' | 'meeting' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user_name: string;
  // Allow any other properties that might come from the API
  [key: string]: any;
}
import type { 
  OrganizationDashboardData,
  OrganizationMetrics,
  OrganizationActivity,
  OrganizationRole,
  OrganizationProject
} from '@/types/organization';

import { SystemHealth, fetchSystemHealth } from '@/services/systemService';

// Define API response type that matches the backend response
interface ApiDashboardResponse {
  metrics: {
    // Support both snake_case and camelCase for backward compatibility
    total_members?: number;
    totalMembers?: number;
    active_members?: number;
    activeMembers?: number;
    total_projects?: number;
    totalProjects?: number;
    active_projects?: number;
    activeProjects?: number;
    pending_tasks?: number;
    pendingTasks?: number;
    completed_tasks?: number;
    completedTasks?: number;
    monthly_revenue?: number;
    monthlyRevenue?: number;
    total_revenue?: number;
    totalRevenue?: number;
    pending_invoices?: number;
    pendingInvoices?: number;
    overdue_invoices?: number;
    overdueInvoices?: number;
    storage_usage?: number;
    storageUsage?: number;
    storage_limit?: number;
    storageLimit?: number;
    team_productivity?: number;
    teamProductivity?: number;
    member_growth?: number;
    memberGrowth?: number;
    project_completion_rate?: number;
    projectCompletionRate?: number;
    member_activity?: Array<{ date: string; active: number; new: number }>;
    memberActivity?: Array<{ date: string; active: number; new: number }>;
    project_status?: Array<{ status: string; count: number; color?: string }>;
    projectStatus?: Array<{ status: string; count: number; color?: string }>;
  };
  recentActivities?: OrganizationActivity[];
  projects?: OrganizationProject[];
  upcomingDeadlines?: any[];
  teamMembers?: any[];
}

// Define types for the dashboard data
type DashboardData = OrganizationDashboardData;

// Recharts components
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

// Import section components
import { SystemHealthSection } from './sections/SystemHealthSection';
import UserManagementSection from './sections/UserManagementSection';
import { UserStatisticsSection } from './sections/UserStatisticsSection';
import { OrganizationManagementSection } from './sections/OrganizationManagementSection';
import { OrganizationMetricsSection } from './sections/OrganizationMetricsSection';

// Types for metric cards
type MetricCard = {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
};



// Default dashboard data
const defaultDashboardData: DashboardData = {
  metrics: {         
    totalOrganizations: 0,
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
} as unknown as DashboardData;

// Import the frontend types from systemService
import { FrontendSystemHealth } from '@/services/systemService';

// Default system health data
const defaultSystemHealth: FrontendSystemHealth = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  system: {
    os: '',
    hostname: '',
    python_version: ''
  },
  database: {
    status: 'disconnected',
    size: 0,
    tables: 0
  },
  server: {
    cpu: 0,
    memory: 0,
    disk: 0, // This is just a number (usage_percent) in the FrontendSystemHealth type
    uptime: ''
  },
  services: []
};

function SuperAdminOverview() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [systemHealth, setSystemHealth] = useState<FrontendSystemHealth>(defaultSystemHealth);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activities, setActivities] = useState<Array<ExtendedActivity>>([]);

  // Format relative time (e.g., '2 hours ago')
  const formatRelativeTime = useCallback((date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    
    if (diffInSeconds < minute) {
      return 'just now';
    } else if (diffInSeconds < hour) {
      const minutes = Math.floor(diffInSeconds / minute);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / day);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  }, []);

  // Format number with commas
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // Format bytes to human readable
  const formatBytes = useCallback((bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }, []);

  // Format uptime
  const formatUptime = useCallback((seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.length > 0 ? parts.join(' ') : '0m';
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [dashboardResponse, healthResponse, activitiesResponse] = await Promise.all([
        fetchDashboardData(),
        fetchSystemHealth(),
        fetchRecentActivities(5) // Get 5 most recent activities
      ]);
      
      setDashboardData(dashboardResponse);
      setSystemHealth(healthResponse);
      setLastUpdated(new Date(healthResponse.timestamp));
      
      // Map activities to natural language format
      const formattedActivities = activitiesResponse.map(activity => {
        const userName = activity.user_details?.full_name || activity.user_details?.username || 'System';
        const objectName = activity.details?.name || activity.object_id || 'item';
        
        // Action mappings for common activity types
        const actionMap: Record<string, string> = {
          // User actions
          'user_created': 'created user',
          'user_updated': 'updated user',
          'user_deleted': 'deleted user',
          'user_logged_in': 'logged in',
          'user_logged_out': 'logged out',
          'user_password_changed': 'changed password',
          'user_profile_updated': 'updated profile',
          
          // Organization actions
          'organization_created': 'created organization',
          'organization_updated': 'updated organization',
          'organization_deleted': 'deleted organization',
          'organization_member_added': 'added member to organization',
          'organization_member_removed': 'removed member from organization',
          'organization_member_role_changed': 'changed role for organization member',
          
          // Project actions
          'project_created': 'created project',
          'project_updated': 'updated project',
          'project_deleted': 'deleted project',
          'project_completed': 'marked project as complete',
          'project_archived': 'archived project',
          
          // Task actions
          'task_created': 'created task',
          'task_updated': 'updated task',
          'task_deleted': 'deleted task',
          'task_completed': 'completed task',
          'task_assigned': 'assigned task',
          'task_unassigned': 'unassigned task',
          
          // Billing actions
          'payment_received': 'received payment',
          'invoice_created': 'created invoice',
          'invoice_sent': 'sent invoice',
          'invoice_paid': 'marked invoice as paid',
          'payment_failed': 'payment failed',
          'subscription_created': 'created subscription',
          'subscription_updated': 'updated subscription',
          'subscription_cancelled': 'cancelled subscription',
          
          // System actions
          'system_update': 'performed system update',
          'settings_updated': 'updated settings',
          'export_completed': 'completed export',
          'import_completed': 'completed import',
          'backup_created': 'created backup',
          'restore_completed': 'completed restore'
        };
        
        // Generate the action text
        const action = actionMap[activity.activity_type] || 
                     activity.activity_type?.replace(/_/g, ' ') || 
                     'performed an action';
        
        // Generate the target text
        let target = '';
        if (activity.object_type && objectName) {
          target = `"${objectName}"`;
        } else if (activity.object_type) {
          target = `the ${activity.object_type}`;
        }
        
        // Combine into a natural language sentence
        const description = `${userName} ${action}${target ? ' ' + target : ''}`;
        
        // Determine the title based on object type
        const titleMap: Record<string, string> = {
          'user': 'User Activity',
          'organization': 'Organization Update',
          'project': 'Project Update',
          'task': 'Task Update',
          'billing': 'Billing Activity',
          'invoice': 'Billing Activity',
          'payment': 'Payment Activity'
        };
        
        const title = titleMap[activity.object_type || ''] || 'System Activity';

        // Create the formatted activity
        const formattedActivity: ExtendedActivity = {
          id: String(activity.id),
          title: title,
          description: description,
          timestamp: activity.created_at || new Date().toISOString(),
          user_name: userName,
          type: (() => {
            if (activity.object_type === 'user') return 'member';
            if (['project', 'task'].includes(activity.object_type || '')) return 'project';
            if (['billing', 'invoice', 'payment'].includes(activity.object_type || '')) return 'billing';
            if (['meeting', 'event'].includes(activity.object_type || '')) return 'meeting';
            return 'system';
          })()
        };

        return formattedActivity;
      });

      setActivities(formattedActivities);
      
      setActivities(formattedActivities);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
    
    // Set up refresh interval (every 5 minutes)
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchData]);
  
  // Memoize dashboard data processing
  const { metrics, recentActivities } = dashboardData;
  const { 
    totalOrganizations = 0,
    totalMembers = 0,
    activeMembers = 0,
    totalProjects = 0,
    activeProjects = 0,
    monthlyRevenue = 0,
    teamProductivity = 0,
    memberGrowth = 0,
    storageUsage = 0,
    storageLimit = 0
  } = metrics || {};

  // Calculate storage metrics
  const storagePercentage = systemHealth.server.disk; // This is the usage percentage
  const storageLimitBytes = 1024 * 1024 * 1024 * 10; // 10GB default limit
  const storageUsageBytes = (storagePercentage / 100) * storageLimitBytes;

  // Prepare metric cards data
  const metricCards = useMemo<MetricCard[]>(() => {
    if (isLoading) {
      return Array(4).fill(0).map((_, i) => ({
        title: 'Loading...',
        value: '...',
        icon: Loader2,
        className: 'animate-pulse'
      }));
    }

    const cards: MetricCard[] = [
      {
        title: 'Total Organizations',
        value: String(metrics.totalOrganizations || 0),
        icon: Building2,
        change: '0% from last month',
        changeType: 'neutral' as const
      },
      {
        title: 'Total Members',
        value: String(metrics.totalMembers || 0),
        change: `${metrics.activeMembers || 0} active`,
        changeType: 'neutral' as const,
        icon: Users,
      },
      {
        title: 'Monthly Revenue',
        value: formatCurrency(metrics.monthlyRevenue || 0),
        change: 'View details',
        changeType: 'positive' as const,
        icon: DollarSign,
      },
      {
        title: 'Total Projects',
        value: String(metrics.totalProjects || 0),
        icon: FolderOpen,
        change: '0% from last month',
        changeType: 'neutral' as const
      },
    ];
    
    return cards;
  }, [isLoading, metrics, formatNumber, formatCurrency]);

  // Update activities when dashboard data changes
  useEffect(() => {
    if (dashboardData.recentActivities) {
      const formattedActivities: ExtendedActivity[] = dashboardData.recentActivities.map(activity => {
        // Convert the activity to the ExtendedActivity format with proper typing
        const timestamp = 'timestamp' in activity ? 
          (typeof activity.timestamp === 'string' ? activity.timestamp : new Date().toISOString()) : 
          new Date().toISOString();
        
        // Ensure the type is one of the allowed values
        const activityType = 'type' in activity ? String(activity.type) : 'system';
        const validTypes: Array<ExtendedActivity['type']> = ['member', 'project', 'billing', 'meeting', 'system'];
        const type = validTypes.includes(activityType as any) ? activityType as ExtendedActivity['type'] : 'system';
        
        return {
          id: 'id' in activity ? String(activity.id) : Math.random().toString(36).substr(2, 9),
          title: 'title' in activity ? String(activity.title) : 'Activity',
          description: 'description' in activity ? String(activity.description) : '',
          timestamp,
          type
        } as ExtendedActivity; // Explicit cast to ensure type safety
      });
      setActivities(formattedActivities);
    }
  }, [dashboardData.recentActivities]);

  // Prepare data for section components
  const organizationMetrics: OrganizationMetrics = useMemo(() => ({
    totalOrganizations: metrics.totalOrganizations || 0,
    totalMembers: metrics.totalMembers || 0,
    activeMembers: metrics.activeMembers || 0,
    totalProjects: metrics.totalProjects || 0,
    activeProjects: metrics.activeProjects || 0,
    monthlyRevenue: metrics.monthlyRevenue || 0,
    memberGrowth: metrics.memberGrowth || 0,
    projectCompletionRate: metrics.projectCompletionRate || 0,
    storageUsage: metrics.storageUsage || 0,
    storageLimit: metrics.storageLimit || 0,
    memberActivity: Array.isArray(metrics.memberActivity) ? metrics.memberActivity : [],
    projectStatus: Array.isArray(metrics.projectStatus) ? metrics.projectStatus : [],
    pendingTasks: metrics.pendingTasks || 0,
    completedTasks: metrics.completedTasks || 0,
    totalRevenue: metrics.totalRevenue || 0,
    pendingInvoices: metrics.pendingInvoices || 0,
    overdueInvoices: metrics.overdueInvoices || 0,
    teamProductivity: metrics.teamProductivity || 0
  }), [metrics]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchData();
  }, [fetchData]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 mr-2 animate-spin" />
        <span>Loading dashboard data...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium">Error Loading Dashboard</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={fetchData}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : 'Try Again'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              System Status
            </CardTitle>
            <div className={`w-3 h-3 rounded-full ${
              systemHealth.status === 'healthy' ? 'bg-green-500' : 
              systemHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{systemHealth.status}</div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.services.filter(s => s.status === 'up').length} of {systemHealth.services.length} services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Database
            </CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {systemHealth.database.status === 'connected' ? 'Connected' : 'Disconnected'}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.database.tables} tables, {formatBytes(systemHealth.database.size)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Server CPU
            </CardTitle>
            <Cpu className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth.server.cpu}%</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className={`h-1.5 rounded-full ${
                  systemHealth.server.cpu < 70 ? 'bg-green-500' : 
                  systemHealth.server.cpu < 90 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(systemHealth.server.cpu, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Server Uptime
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.server.uptime}
            </div>
            <p className="text-xs text-muted-foreground">
              System uptime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Storage and Services */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Storage Usage
            </CardTitle>
            <div className={`w-3 h-3 rounded-full ${
              storagePercentage < 70 ? 'bg-green-500' : 
              storagePercentage < 90 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Storage</span>
                <span>{storagePercentage}% used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    storagePercentage < 70 ? 'bg-green-500' : 
                    storagePercentage < 90 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(storageLimit - storageUsage)} available
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              System Services
            </CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemHealth.services.map((service, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{service.name}</span>
                  <span className={`inline-flex items-center ${
                    service.status === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {service.status === 'up' ? 'Running' : 'Stopped'}
                    <span className="ml-1">
                      {service.status === 'up' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage Usage</span>
                <span className="font-medium">
                  {formatNumber(metrics.storageUsage)} / {formatNumber(metrics.storageLimit)} MB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Invoices</span>
                <span className="font-medium">{formatNumber(metrics.pendingInvoices)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overdue Invoices</span>
                <span className="font-medium">{formatNumber(metrics.overdueInvoices)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.change && (
                <p className={`text-xs ${
                  card.changeType === 'positive' ? 'text-green-500' : 
                  card.changeType === 'negative' ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                  {card.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Latest system and user activities
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => fetchData()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading && activities.length === 0 ? (
              <div className="flex items-center justify-center py-8 px-4">
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading activities...</span>
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full ${
                      activity.type === 'member' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      activity.type === 'project' ? 'bg-green-100 dark:bg-green-900/30' :
                      activity.type === 'billing' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      activity.type === 'meeting' ? 'bg-amber-100 dark:bg-amber-900/30' :
                      'bg-muted'
                    }`}>
                      {activity.type === 'member' ? (
                        <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : activity.type === 'project' ? (
                        <FolderPlus className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : activity.type === 'billing' ? (
                        <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      ) : activity.type === 'meeting' ? (
                        <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium text-foreground">
                        {activity.type === 'member' ? 'User Activity' : 
                         activity.type === 'project' ? 'Project Update' :
                         activity.type === 'billing' ? 'Billing Activity' :
                         activity.type === 'meeting' ? 'Meeting' : 'System'}
                      </h4>
                      <span 
                        className="text-xs text-muted-foreground whitespace-nowrap ml-2 flex-shrink-0"
                        title={new Date(activity.timestamp).toLocaleString()}
                      >
                        {formatRelativeTime(new Date(activity.timestamp))}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">{activity.user_name}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Activity className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No recent activities</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activities will appear here as they happen
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Components - These are now self-contained with their own data fetching */}
      <div className="space-y-6">
        {/* <SystemHealthSection />
        <UserStatisticsSection />
        <OrganizationMetricsSection />
        <UserManagementSection />
        <OrganizationManagementSection />
        <SystemSettingsSection /> */}
      </div>
    </div>
  );
}

export default SuperAdminOverview;