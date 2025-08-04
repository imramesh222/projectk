'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FolderOpen, 
  DollarSign, 
  TrendingUp,
  Activity,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  fetchDashboardData,
  type MemberActivity,
  type ProjectStatus,
  type RecentActivity,
  type OrganizationMetrics
} from '@/services/organizationService';
import { useToast } from '@/hooks/use-toast';

// Type for metrics cards
interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: any;
}

export function SuperAdminOverview() {
  console.log('Rendering SuperAdminOverview component');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    metrics: OrganizationMetrics | null;
    memberActivity: MemberActivity[];
    projectStatus: ProjectStatus[];
    recentActivities: RecentActivity[];
  }>({
    metrics: null,
    memberActivity: [],
    projectStatus: [],
    recentActivities: []
  });
  const [error, setError] = useState<string | null>(null);

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting to load dashboard data...');
        setIsLoading(true);
        setError(null);
        
        // Fetch all dashboard data in a single request
        console.log('Calling fetchDashboardData()...');
        const data = await fetchDashboardData();
        
        console.log('Received dashboard data:', JSON.stringify(data, null, 2));
        
        setDashboardData({
          metrics: data.metrics,
          memberActivity: data.memberActivity || [],
          projectStatus: data.projectStatus || [],
          recentActivities: data.recentActivities || []
        });
        
        console.log('Dashboard data state updated');
      } catch (error) {
        const err = error as Error & { response?: any };
        console.error('Error loading dashboard data:', err);
        
        const errorDetails = {
          name: err.name,
          message: err.message,
          stack: err.stack,
          response: err.response ? {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data
          } : 'No response data'
        };
        
        console.error('Error details:', errorDetails);
        
        setError('Failed to load dashboard data. Please try again later.');
        toast({
          title: 'Error',
          description: `Failed to load dashboard data: ${err.message || 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  // Loading state
  if (isLoading || !dashboardData.metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { metrics, memberActivity, projectStatus, recentActivities } = dashboardData;
  


  // Prepare metric cards data
  const metricCards: MetricCard[] = [
    {
      title: 'Total Members',
      value: formatNumber(metrics.totalMembers),
      change: `${metrics.memberGrowth >= 0 ? '+' : ''}${metrics.memberGrowth}%`,
      changeType: metrics.memberGrowth >= 0 ? 'positive' : 'negative',
      icon: Users,
    },
    {
      title: 'Active Projects',
      value: formatNumber(metrics.activeProjects),
      change: '+8.2%',
      changeType: 'positive',
      icon: FolderOpen,
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(metrics.monthlyRevenue),
      change: '+15.3%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      title: 'Team Productivity',
      value: `${metrics.teamProductivity}%`,
      change: '+2.1%',
      changeType: 'positive',
      icon: Activity,
    },
  ];

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organization Overview</h1>
        <p className="mt-2 text-gray-600">Monitor your organization's performance and manage your team</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric: MetricCard, index: number) => (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <p className={`text-xs flex items-center mt-1 ${
                metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {metric.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Member Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memberActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="active" 
                    name="Active Members"
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="new" 
                    name="New Members"
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex flex-col items-center justify-center">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {projectStatus.map((entry: ProjectStatus, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value}%`,
                        props.payload.name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                {projectStatus.map((status: ProjectStatus, index: number) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm text-gray-600">
                      {status.name} ({status.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activities</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity: RecentActivity) => (
              <div key={activity.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {activity.type === 'member' && <Users className="h-5 w-5 text-blue-500" />}
                    {activity.type === 'project' && <FolderOpen className="h-5 w-5 text-green-500" />}
                    {activity.type === 'billing' && <DollarSign className="h-5 w-5 text-purple-500" />}
                    {activity.type === 'meeting' && <Clock className="h-5 w-5 text-amber-500" />}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.user} • <span className="text-xs text-gray-400">{activity.time}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SuperAdminOverview;
