'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FolderOpen, 
  CheckSquare, 
  Users, 
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const metrics = [
  {
    title: 'Active Projects',
    value: '8',
    change: '+2 this month',
    changeType: 'positive',
    icon: FolderOpen,
  },
  {
    title: 'Total Tasks',
    value: '127',
    change: '+15 this week',
    changeType: 'positive',
    icon: CheckSquare,
  },
  {
    title: 'Team Members',
    value: '12',
    change: '+1 new member',
    changeType: 'positive',
    icon: Users,
  },
  {
    title: 'On-Time Delivery',
    value: '94%',
    change: '+3% improvement',
    changeType: 'positive',
    icon: Target,
  },
];

const projectProgressData = [
  { name: 'E-commerce Platform', progress: 85, deadline: '2024-02-15', status: 'on-track' },
  { name: 'Mobile App v2.0', progress: 62, deadline: '2024-03-01', status: 'on-track' },
  { name: 'API Integration', progress: 45, deadline: '2024-02-28', status: 'at-risk' },
  { name: 'Dashboard Redesign', progress: 78, deadline: '2024-02-20', status: 'on-track' },
  { name: 'Security Audit', progress: 30, deadline: '2024-03-15', status: 'delayed' },
];

const teamWorkloadData = [
  { member: 'Alice', tasks: 8, capacity: 10 },
  { member: 'Bob', tasks: 12, capacity: 10 },
  { member: 'Carol', tasks: 6, capacity: 10 },
  { member: 'David', tasks: 9, capacity: 10 },
  { member: 'Eve', tasks: 7, capacity: 10 },
];

const taskCompletionData = [
  { week: 'W1', completed: 23, planned: 25 },
  { week: 'W2', completed: 28, planned: 30 },
  { week: 'W3', completed: 32, planned: 28 },
  { week: 'W4', completed: 27, planned: 30 },
];

const upcomingDeadlines = [
  { project: 'E-commerce Platform', task: 'Payment Integration', deadline: '2024-01-18', priority: 'high' },
  { project: 'Mobile App v2.0', task: 'User Authentication', deadline: '2024-01-20', priority: 'medium' },
  { project: 'Dashboard Redesign', task: 'UI Components', deadline: '2024-01-22', priority: 'high' },
  { project: 'API Integration', task: 'Data Migration', deadline: '2024-01-25', priority: 'low' },
];

export function ManagerOverview() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-100';
      case 'at-risk': return 'text-yellow-600 bg-yellow-100';
      case 'delayed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Manager Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor project progress and manage your team's workload</p>
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
              <p className="text-xs text-green-600 mt-1">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Progress and Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Current status of active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectProgressData.map((project) => (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{project.name}</span>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={project.progress} className="flex-1" />
                    <span className="text-sm text-gray-500 w-12">{project.progress}%</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    Due: {project.deadline}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
            <CardDescription>Current task distribution across team members</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamWorkloadData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 12]} />
                <YAxis dataKey="member" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3B82F6" name="Current Tasks" />
                <Bar dataKey="capacity" fill="#E5E7EB" name="Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Task Completion Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Trends</CardTitle>
          <CardDescription>Weekly task completion vs planned tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={taskCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed" />
              <Line type="monotone" dataKey="planned" stroke="#3B82F6" strokeWidth={2} name="Planned" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Tasks due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.task}</p>
                    <p className="text-sm text-gray-500">{item.project}</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-xs text-gray-500">{item.deadline}</span>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Deadlines
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used project management functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-20 flex-col space-y-2">
                <CheckSquare className="h-6 w-6" />
                <span>Create Task</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <FolderOpen className="h-6 w-6" />
                <span>New Project</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Users className="h-6 w-6" />
                <span>Team Meeting</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Calendar className="h-6 w-6" />
                <span>Schedule Review</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Project Risks & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">API Integration behind schedule</p>
                  <p className="text-sm text-red-600">Project is 2 weeks behind the planned timeline</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Bob is overloaded</p>
                  <p className="text-sm text-yellow-600">Currently assigned 12 tasks (120% capacity)</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Reassign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}