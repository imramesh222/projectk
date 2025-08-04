'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckSquare, 
  Code, 
  GitBranch, 
  Clock,
  TrendingUp,
  Calendar,
  AlertCircle,
  Target,
  Coffee
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const metrics = [
  {
    title: 'Active Tasks',
    value: '8',
    change: '+2 this week',
    changeType: 'positive',
    icon: CheckSquare,
  },
  {
    title: 'Code Reviews',
    value: '5',
    change: '3 pending',
    changeType: 'neutral',
    icon: Code,
  },
  {
    title: 'Commits This Week',
    value: '23',
    change: '+15% vs last week',
    changeType: 'positive',
    icon: GitBranch,
  },
  {
    title: 'Sprint Progress',
    value: '75%',
    change: 'On track',
    changeType: 'positive',
    icon: Target,
  },
];

const myTasks = [
  { id: 1, title: 'Implement user authentication', project: 'E-commerce Platform', priority: 'high', status: 'in-progress', progress: 60, dueDate: '2024-01-18' },
  { id: 2, title: 'Fix payment gateway bug', project: 'Mobile App v2.0', priority: 'high', status: 'todo', progress: 0, dueDate: '2024-01-19' },
  { id: 3, title: 'Optimize database queries', project: 'API Integration', priority: 'medium', status: 'in-progress', progress: 80, dueDate: '2024-01-22' },
  { id: 4, title: 'Write unit tests', project: 'Dashboard Redesign', priority: 'medium', status: 'todo', progress: 0, dueDate: '2024-01-25' },
  { id: 5, title: 'Code review for team member', project: 'Security Audit', priority: 'low', status: 'review', progress: 100, dueDate: '2024-01-20' },
];

const productivityData = [
  { day: 'Mon', commits: 4, hours: 8 },
  { day: 'Tue', commits: 6, hours: 7.5 },
  { day: 'Wed', commits: 3, hours: 8 },
  { day: 'Thu', commits: 5, hours: 8.5 },
  { day: 'Fri', commits: 5, hours: 7 },
];

const codeReviews = [
  { id: 1, title: 'Add shopping cart functionality', author: 'Alice Johnson', project: 'E-commerce Platform', status: 'pending', priority: 'high' },
  { id: 2, title: 'Update user profile UI', author: 'Bob Smith', project: 'Mobile App v2.0', status: 'approved', priority: 'medium' },
  { id: 3, title: 'Implement search filters', author: 'Carol Davis', project: 'Dashboard Redesign', status: 'changes-requested', priority: 'low' },
];

const upcomingDeadlines = [
  { task: 'Implement user authentication', project: 'E-commerce Platform', deadline: '2024-01-18', hoursLeft: 6 },
  { task: 'Fix payment gateway bug', project: 'Mobile App v2.0', deadline: '2024-01-19', hoursLeft: 30 },
  { task: 'Code review for team member', project: 'Security Audit', deadline: '2024-01-20', hoursLeft: 54 },
];

export function DeveloperOverview() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'text-gray-600 bg-gray-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'review': return 'text-purple-600 bg-purple-100';
      case 'done': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'changes-requested': return 'text-red-600 bg-red-100';
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
        <h1 className="text-3xl font-bold text-gray-900">Developer Dashboard</h1>
        <p className="mt-2 text-gray-600">Track your tasks, code reviews, and development progress</p>
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
              <p className={`text-xs mt-1 ${
                metric.changeType === 'positive' ? 'text-green-600' : 
                metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Tasks and Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Your current assigned tasks and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="space-y-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{task.project}</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={task.progress} className="flex-1" />
                    <span className="text-sm text-gray-500 w-12">{task.progress}%</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    Due: {task.dueDate}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Tasks
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Productivity</CardTitle>
            <CardDescription>Your commits and work hours this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="commits" fill="#3B82F6" name="Commits" />
                <Bar dataKey="hours" fill="#10B981" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Code Reviews and Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Code Reviews
            </CardTitle>
            <CardDescription>Pending code reviews requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {codeReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{review.title}</p>
                    <p className="text-sm text-gray-500">by {review.author}</p>
                    <p className="text-xs text-gray-400">{review.project}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(review.priority)}>
                      {review.priority}
                    </Badge>
                    <Badge className={getStatusColor(review.status)}>
                      {review.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Reviews
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Tasks due in the next few days</CardDescription>
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
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{item.hoursLeft}h</p>
                    <p className="text-xs text-gray-500">remaining</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used development tools and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2">
              <CheckSquare className="h-6 w-6" />
              <span>Update Task</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Code className="h-6 w-6" />
              <span>Code Review</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <GitBranch className="h-6 w-6" />
              <span>Create Branch</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Coffee className="h-6 w-6" />
              <span>Log Break</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">Great Progress!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">You've completed 15% more tasks this week</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-800">Code Quality</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">Your code reviews have 95% approval rate</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-800">Sprint Goal</span>
              </div>
              <p className="text-sm text-purple-600 mt-1">75% complete - on track for sprint goal</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}