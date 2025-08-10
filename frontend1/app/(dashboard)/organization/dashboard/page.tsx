'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  ChevronRight, 
  BarChart3,
  DollarSign,
  FileText,
  MessageSquare,
  UserCheck,
  Zap,
  Target,
  Loader2
} from 'lucide-react';
import { MetricCard } from '@/components/common/dashboard/MetricCard';
import { ActivityFeed } from '@/components/common/dashboard/ActivityFeed';
import { DashboardSection } from '@/components/common/dashboard/DashboardSection';
import { fetchDashboardData, fetchChartData } from '@/services/dashboardService';
import type { DashboardMetrics, ActivityItem, ProjectItem } from '@/services/dashboardService';

export default function OrganizationDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const user = getCurrentUser();
        const isSuperAdmin = user?.role === 'superadmin';
        const data = await fetchDashboardData(isSuperAdmin);
        setMetrics(data.metrics);
        setActivities(data.recent_activities);
        setProjects(data.active_projects);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Format metrics for display
  const stats = [
    { 
      title: 'Total Members', 
      value: metrics?.total_members.toLocaleString() ?? '--', 
      icon: Users, 
      change: metrics?.member_growth ?? 0, 
      description: 'Across all teams' 
    },
    { 
      title: 'Active Now', 
      value: metrics?.active_members.toLocaleString() ?? '--', 
      icon: UserCheck, 
      change: 0, // Not in metrics yet
      description: 'In the last 30 minutes' 
    },
    { 
      title: 'Monthly Revenue', 
      value: `$${metrics?.monthly_revenue.toLocaleString() ?? '--'}`, 
      icon: DollarSign, 
      change: metrics?.revenue_change ?? 0, 
      description: 'From subscriptions' 
    },
    { 
      title: 'Tasks Completed', 
      value: metrics?.tasks_completed.toLocaleString() ?? '--', 
      icon: CheckCircle, 
      change: metrics?.task_completion_rate ?? 0, 
      description: 'This month' 
    },
    { 
      title: 'Performance', 
      value: metrics?.team_performance ? `${metrics.team_performance.toFixed(1)}%` : '--', 
      icon: BarChart3, 
      change: 0, // Not in metrics yet
      description: 'Team efficiency' 
    },
    { 
      title: 'Active Projects', 
      value: metrics?.active_projects ? metrics.active_projects.toLocaleString() : '--', 
      icon: Target, 
      change: 0, // Not in metrics yet
      description: 'In progress' 
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md bg-red-50 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your organization.
          </p>
        </div>
        <Button>
          Generate Report
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Metrics Section */}
      <DashboardSection title="Key Metrics" description="Overview of your organization's performance">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <MetricCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={<stat.icon className="h-6 w-6" />}
              description={stat.description}
              className="h-full transition-all duration-300 hover:shadow-md"
            />
          ))}
        </div>
      </DashboardSection>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <DashboardSection title="Recent Activity" description="Latest activities across your organization">
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => {
                const statusColors = {
                  success: 'bg-green-100 text-green-600',
                  warning: 'bg-yellow-100 text-yellow-600',
                  error: 'bg-red-100 text-red-600',
                  info: 'bg-blue-100 text-blue-600'
                };
                
                const iconMap = {
                  info: FileText,
                  success: CheckCircle,
                  warning: AlertCircle,
                  error: AlertCircle
                };
                
                const Icon = iconMap[activity.type] || FileText;
                const statusColor = statusColors[activity.type] || 'bg-gray-100 text-gray-600';
                
                return (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-full ${statusColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      {activity.user && (
                        <p className="mt-1 text-xs text-gray-500">
                          {activity.user.name}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </DashboardSection>

        {/* Projects */}
        <DashboardSection 
          title="Projects" 
          description="Active projects in your organization"
          action={
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          }
        >
          <div className="space-y-4">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div key={project.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <div className="flex items-center mt-1 space-x-2">
                        <span 
                          className={`px-2 py-0.5 text-xs rounded-full text-white ${project.status_color}`}
                        >
                          {project.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {project.members_count} member{project.members_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Due {new Date(project.deadline).toLocaleDateString()}
                      </p>
                      <div className="flex items-center justify-end mt-1 space-x-2">
                        <span className="text-xs text-gray-500">
                          {project.progress}%
                        </span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div 
                            className={`h-full rounded-full ${
                              project.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No active projects</p>
              </div>
            )}
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
