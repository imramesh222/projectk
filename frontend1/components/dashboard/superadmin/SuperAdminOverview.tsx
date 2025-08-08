'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Activity, 
  DollarSign, 
  FolderOpen, 
  UserCheck, 
  Briefcase,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

// Import services and types
import { fetchDashboardData } from '@/services/organizationService';
import type { 
  OrganizationDashboardData,
  OrganizationMetrics,
  OrganizationActivity,
  OrganizationProject,
  OrganizationRole
} from '@/types/organization';

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
import { SystemSettingsSection } from './sections/SystemSettingsSection';
import UserManagementSection from './sections/UserManagementSection';
import { UserStatisticsSection } from './sections/UserStatisticsSection';
import { OrganizationManagementSection } from './sections/OrganizationManagementSection';
import { OrganizationMetricsSection } from './sections/OrganizationMetricsSection';

// Type for metrics cards
interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

// Default dashboard data
const defaultDashboardData: DashboardData = {
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

function SuperAdminOverview() {
  console.log('Rendering SuperAdminOverview component');
  // All hooks must be called at the top level
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  
  // Format number with commas
  const formatNumber = useCallback((num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
  
  // Memoize dashboard data processing
  const { metrics, recentActivities } = dashboardData;
  const { memberActivity, projectStatus } = metrics;

  // Prepare metric cards data
  const metricCards: MetricCard[] = useMemo(() => {
    const {
      totalMembers = 0,
      activeMembers = 0,
      activeProjects = 0,
      totalProjects = 0,
      monthlyRevenue = 0,
      totalRevenue = 0,
      teamProductivity = 0,
      projectCompletionRate = 0,
      memberGrowth = 0
    } = metrics || {};

    return [
      {
        title: 'Total Members',
        value: formatNumber(totalMembers),
        change: `${memberGrowth}% from last month`,
        changeType: memberGrowth >= 0 ? 'positive' : 'negative',
        icon: Users,
      },
      {
        title: 'Active Members',
        value: formatNumber(activeMembers),
        change: `${Math.round((activeMembers / Math.max(totalMembers, 1)) * 100)}% of total`,
        changeType: 'neutral',
        icon: UserCheck,
      },
      {
        title: 'Total Projects',
        value: formatNumber(totalProjects),
        change: `${activeProjects} active`,
        changeType: 'neutral',
        icon: Briefcase,
      },
      {
        title: 'Monthly Revenue',
        value: formatCurrency(monthlyRevenue),
        change: `${Math.round(teamProductivity)}% team productivity`,
        changeType: 'positive',
        icon: DollarSign,
      },
    ];
  }, [metrics, formatNumber, formatCurrency]);

  // Prepare data for section components
  const organizationMetrics: OrganizationMetrics = useMemo(() => ({
    totalMembers: metrics.totalMembers || 0,
    activeMembers: metrics.activeMembers || 0,
    totalProjects: metrics.totalProjects || 0,
    activeProjects: metrics.activeProjects || 0,
    pendingTasks: metrics.pendingTasks || 0,
    completedTasks: metrics.completedTasks || 0,
    monthlyRevenue: metrics.monthlyRevenue || 0,
    totalRevenue: metrics.totalRevenue || 0,
    pendingInvoices: metrics.pendingInvoices || 0,
    overdueInvoices: metrics.overdueInvoices || 0,
    storageUsage: metrics.storageUsage || 0,
    storageLimit: metrics.storageLimit || 0,
    teamProductivity: metrics.teamProductivity || 0,
    memberGrowth: metrics.memberGrowth || 0,
    projectCompletionRate: metrics.projectCompletionRate || 0,
    memberActivity: Array.isArray(metrics.memberActivity) ? metrics.memberActivity : [],
    projectStatus: Array.isArray(metrics.projectStatus) 
      ? metrics.projectStatus 
      : []
  }), [metrics]);

  // Data fetching effect
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchDashboardData() as unknown as ApiDashboardResponse;
        
        // Map the response to match our DashboardData type
        const metrics = response.metrics || {};
        const mappedData: DashboardData = {
          metrics: {
            totalMembers: metrics.totalMembers ?? metrics.total_members ?? 0,
            activeMembers: metrics.activeMembers ?? metrics.active_members ?? 0,
            totalProjects: metrics.totalProjects ?? metrics.total_projects ?? 0,
            activeProjects: metrics.activeProjects ?? metrics.active_projects ?? 0,
            pendingTasks: metrics.pendingTasks ?? metrics.pending_tasks ?? 0,
            completedTasks: metrics.completedTasks ?? metrics.completed_tasks ?? 0,
            monthlyRevenue: metrics.monthlyRevenue ?? metrics.monthly_revenue ?? 0,
            totalRevenue: metrics.totalRevenue ?? metrics.total_revenue ?? 0,
            pendingInvoices: metrics.pendingInvoices ?? metrics.pending_invoices ?? 0,
            overdueInvoices: metrics.overdueInvoices ?? metrics.overdue_invoices ?? 0,
            storageUsage: metrics.storageUsage ?? metrics.storage_usage ?? 0,
            storageLimit: metrics.storageLimit ?? metrics.storage_limit ?? 0,
            teamProductivity: metrics.teamProductivity ?? metrics.team_productivity ?? 0,
            memberGrowth: metrics.memberGrowth ?? metrics.member_growth ?? 0,
            projectCompletionRate: metrics.projectCompletionRate ?? metrics.project_completion_rate ?? 0,
            memberActivity: metrics.memberActivity ?? metrics.member_activity ?? [],
            projectStatus: (metrics.projectStatus ?? metrics.project_status ?? []).map(ps => ({
              status: ps.status,
              count: ps.count,
              color: ps.color || '#3b82f6' // Default blue color if not provided
            }))
          },
          recentActivities: response.recentActivities ?? [],
          projects: response.projects ?? [],
          upcomingDeadlines: response.upcomingDeadlines ?? [],
          teamMembers: response.teamMembers ?? []
        };
        
        setDashboardData(mappedData);
        setError(null);
      } catch (err) {
        const error = err as Error & { response?: any };
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        toast({
          title: 'Error',
          description: `Failed to load dashboard data: ${error.message || 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Main component render
  return (
    <div className="space-y-6">
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
                <p className="text-xs text-muted-foreground">
                  {card.change}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Organization Metrics Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Members</span>
                <span className="font-medium">{formatNumber(metrics.totalMembers)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Projects</span>
                <span className="font-medium">{formatNumber(metrics.activeProjects)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                <span className="font-medium">{formatCurrency(metrics.monthlyRevenue)}</span>
              </div>
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

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action || 'Activity'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action || 'No details available'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activities</p>
          )}
        </CardContent>
      </Card>

      {/* Section Components - These are now self-contained with their own data fetching */}
      <div className="space-y-6">
        <SystemHealthSection />
        <UserStatisticsSection />
        <OrganizationMetricsSection />
        <UserManagementSection />
        <OrganizationManagementSection />
        <SystemSettingsSection />
      </div>
    </div>
  );
}

export default SuperAdminOverview;