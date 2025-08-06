'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Calendar, TrendingUp, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrganizationDashboard() {
  // Stats data
  const stats = [
    { title: 'Total Members', value: '1,248', icon: Users, change: '12%', trend: 'up' },
    { title: 'Active Now', value: '42', icon: Clock, change: '8%', trend: 'up' },
    { title: 'Upcoming Events', value: '18', icon: Calendar, change: '5%', trend: 'down' },
  ];

  // Recent activities
  const activities = [
    { id: 1, title: 'New member joined', desc: 'John Doe joined the organization', time: '2 minutes ago', icon: Users, status: 'success' },
    { id: 2, title: 'Project update', desc: 'New features added to Dashboard', time: '1 hour ago', icon: TrendingUp, status: 'info' },
    { id: 3, title: 'System alert', desc: 'High server load detected', time: '3 hours ago', icon: AlertCircle, status: 'warning' },
  ];

  // Projects data
  const projects = [
    { id: 1, name: 'Website Redesign', status: 'In Progress', progress: 65, members: 8, deadline: 'Dec 15, 2023', statusColor: 'bg-blue-500' },
    { id: 2, name: 'Mobile App', status: 'On Hold', progress: 30, members: 5, deadline: 'Jan 20, 2024', statusColor: 'bg-yellow-500' },
    { id: 3, name: 'API Integration', status: 'Completed', progress: 100, members: 4, deadline: 'Nov 25, 2023', statusColor: 'bg-green-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Admin</p>
        </div>
        <Button>Create New</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change} {stat.trend === 'up' ? '↑' : '↓'}
                </span>
                <span className="ml-1">vs last week</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' :
                    activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.desc}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Projects</CardTitle>
              <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{project.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${project.statusColor}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{project.members} Members</span>
                    <span>Due: {project.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
