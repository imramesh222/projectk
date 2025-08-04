'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FolderOpen, 
  DollarSign, 
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const metrics = [
  {
    title: 'Total Members',
    value: '156',
    change: '+12.5%',
    changeType: 'positive',
    icon: Users,
  },
  {
    title: 'Active Projects',
    value: '23',
    change: '+8.2%',
    changeType: 'positive',
    icon: FolderOpen,
  },
  {
    title: 'Monthly Revenue',
    value: '$45,230',
    change: '+15.3%',
    changeType: 'positive',
    icon: DollarSign,
  },
  {
    title: 'Team Productivity',
    value: '94%',
    change: '+2.1%',
    changeType: 'positive',
    icon: Activity,
  },
];

const memberActivityData = [
  { month: 'Jan', active: 120, new: 15 },
  { month: 'Feb', active: 132, new: 18 },
  { month: 'Mar', active: 145, new: 22 },
  { month: 'Apr', active: 151, new: 12 },
  { month: 'May', active: 156, new: 19 },
  { month: 'Jun', active: 156, new: 8 },
];

const projectStatusData = [
  { name: 'Completed', value: 45, color: '#10B981' },
  { name: 'In Progress', value: 30, color: '#3B82F6' },
  { name: 'Planning', value: 15, color: '#F59E0B' },
  { name: 'On Hold', value: 10, color: '#EF4444' },
];

const recentActivities = [
  { id: 1, action: 'New member joined', user: 'Sarah Wilson', time: '5 minutes ago', type: 'member' },
  { id: 2, action: 'Project milestone completed', user: 'Mobile App v2.0', time: '1 hour ago', type: 'project' },
  { id: 3, action: 'Invoice generated', user: '$12,500', time: '2 hours ago', type: 'billing' },
  { id: 4, action: 'Team meeting scheduled', user: 'Weekly Standup', time: '3 hours ago', type: 'meeting' },
  { id: 5, action: 'New project created', user: 'E-commerce Platform', time: '5 hours ago', type: 'project' },
];

export function AdminOverview() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organization Overview</h1>
        <p className="mt-2 text-gray-600">Monitor your organization's performance and manage your team</p>
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
            <CardTitle>Member Activity</CardTitle>
            <CardDescription>Active members and new joiners over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={memberActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="active" stroke="#3B82F6" strokeWidth={2} name="Active Members" />
                <Line type="monotone" dataKey="new" stroke="#10B981" strokeWidth={2} name="New Members" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current status of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {projectStatusData.map((entry) => (
                <div key={entry.name} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest organization activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'billing' ? 'bg-green-500' :
                    activity.type === 'project' ? 'bg-blue-500' :
                    activity.type === 'member' ? 'bg-purple-500' :
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
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used administrative functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-20 flex-col space-y-2">
                <Users className="h-6 w-6" />
                <span>Add Member</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <FolderOpen className="h-6 w-6" />
                <span>New Project</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Calendar className="h-6 w-6" />
                <span>Schedule Meeting</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <DollarSign className="h-6 w-6" />
                <span>View Billing</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
            Important Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Billing reminder</p>
                  <p className="text-sm text-amber-600">Your subscription expires in 7 days</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Renew Now
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Team capacity</p>
                  <p className="text-sm text-blue-600">You're approaching your member limit (156/200)</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Upgrade Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}