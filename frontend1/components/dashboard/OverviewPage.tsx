'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Shield,
  Clock,
  Server,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const metrics = [
  {
    title: 'Total Users',
    value: '24,847',
    change: '+12.5%',
    changeType: 'positive',
    icon: Users,
  },
  {
    title: 'Organizations',
    value: '1,247',
    change: '+8.2%',
    changeType: 'positive',
    icon: Building2,
  },
  {
    title: 'Security Alerts',
    value: '23',
    change: '-15.3%',
    changeType: 'negative',
    icon: AlertTriangle,
  },
  {
    title: 'System Uptime',
    value: '99.9%',
    change: '+0.1%',
    changeType: 'positive',
    icon: Activity,
  },
];

const userGrowthData = [
  { month: 'Jan', users: 18000 },
  { month: 'Feb', users: 19200 },
  { month: 'Mar', users: 20800 },
  { month: 'Apr', users: 22100 },
  { month: 'May', users: 23400 },
  { month: 'Jun', users: 24847 },
];

const orgGrowthData = [
  { month: 'Jan', orgs: 980 },
  { month: 'Feb', orgs: 1050 },
  { month: 'Mar', orgs: 1120 },
  { month: 'Apr', orgs: 1180 },
  { month: 'May', orgs: 1210 },
  { month: 'Jun', orgs: 1247 },
];

const recentActivities = [
  { id: 1, action: 'New user registration', user: 'john.doe@example.com', time: '2 minutes ago', type: 'user' },
  { id: 2, action: 'Organization created', user: 'TechCorp Inc.', time: '15 minutes ago', type: 'org' },
  { id: 3, action: 'Security alert resolved', user: 'System', time: '1 hour ago', type: 'security' },
  { id: 4, action: 'Backup completed', user: 'System', time: '2 hours ago', type: 'system' },
  { id: 5, action: 'Role permissions updated', user: 'admin@company.com', time: '3 hours ago', type: 'permission' },
];

const systemHealth = [
  { name: 'API Server', status: 'healthy', uptime: '99.9%' },
  { name: 'Database', status: 'healthy', uptime: '99.8%' },
  { name: 'Cache', status: 'warning', uptime: '97.2%' },
  { name: 'Storage', status: 'healthy', uptime: '99.9%' },
];

export function OverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">Monitor your system performance and manage your platform</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Monthly user registration trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Growth</CardTitle>
            <CardDescription>Monthly organization creation trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orgGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orgs" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest system activities and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'security' ? 'bg-red-500' :
                    activity.type === 'system' ? 'bg-blue-500' :
                    activity.type === 'org' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Activities
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              System Health
            </CardTitle>
            <CardDescription>Current status of system components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealth.map((component) => (
                <div key={component.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      component.status === 'healthy' ? 'bg-green-500' :
                      component.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <span className="font-medium text-gray-900">{component.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      component.status === 'healthy' ? 'default' :
                      component.status === 'warning' ? 'secondary' :
                      'destructive'
                    }>
                      {component.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{component.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Shield className="h-4 w-4 mr-2" />
              View Detailed Status
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used administrative functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Building2 className="h-6 w-6" />
              <span>Organizations</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Settings className="h-6 w-6" />
              <span>System Settings</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Shield className="h-6 w-6" />
              <span>Security Center</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}