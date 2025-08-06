'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Activity, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Project = {
  name: string;
  progress: number;
  status: 'In Progress' | 'On Track' | 'Delayed';
  members: number;
  deadline: string;
};

type ActivityItem = {
  id: number;
  title: string;
  desc: string;
  time: string;
  icon: React.ElementType;
  status: 'success' | 'info' | 'warning';
};

type StatCard = {
  title: string;
  value: string;
  icon: React.ElementType;
  change: string;
  trend: 'up' | 'down';
};

export default function OrganizationDashboard() {
  // Stats data
  const stats: StatCard[] = [
    { title: 'Total Members', value: '1,248', icon: Users, change: '12%', trend: 'up' },
    { title: 'Active Now', value: '42', icon: Clock, change: '8%', trend: 'up' },
    { title: 'Projects', value: '18', icon: Activity, change: '5%', trend: 'up' },
  ];

  // Recent activities
  const activities: ActivityItem[] = [
    { id: 1, title: 'New member joined', desc: 'John Doe joined the team', time: '2m ago', icon: Users, status: 'success' },
    { id: 2, title: 'Project update', desc: 'New features added to dashboard', time: '1h ago', icon: TrendingUp, status: 'info' },
    { id: 3, title: 'Storage alert', desc: 'Approaching storage limit', time: '3h ago', icon: AlertCircle, status: 'warning' },
  ];

  // Projects data
  const projects: Project[] = [
    { name: 'Website Redesign', progress: 75, status: 'In Progress', members: 5, deadline: 'Dec 15, 2023' },
    { name: 'API Migration', progress: 45, status: 'On Track', members: 3, deadline: 'Jan 20, 2024' },
    { name: 'Mobile App', progress: 30, status: 'Delayed', members: 4, deadline: 'Nov 25, 2023' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Organization Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization's settings and members</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline">Invite Members</Button>
          <Button>New Project</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change} {stat.trend === 'up' ? '↑' : '↓'}
                </span>
                <span> vs last week</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Recent Activities</CardTitle>
              <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
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
                  <div>
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
              {projects.map((project, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{project.name}</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        project.status === 'In Progress' ? 'bg-blue-500' :
                        project.status === 'On Track' ? 'bg-green-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{project.members} members</span>
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
