'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Server, 
  Activity,
  AlertCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Network,
  Shield,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type SystemMetric = {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'stable';
};

export function SystemMetrics() {
  // Mock data - replace with actual API calls
  const metrics: SystemMetric[] = [
    {
      title: 'Total Users',
      value: '1,248',
      icon: Users,
      trend: 'up',
      status: 'success'
    },
    {
      title: 'Active Organizations',
      value: '42',
      icon: Server,
      trend: 'up',
      status: 'success'
    },
    {
      title: 'System Uptime',
      value: '99.98%',
      icon: Clock,
      status: 'success'
    },
    {
      title: 'Active Alerts',
      value: '3',
      icon: AlertCircle,
      status: 'warning',
      trend: 'up'
    },
    {
      title: 'CPU Usage',
      value: '24%',
      icon: Cpu,
      status: 'success',
      description: '8 cores, 2.4GHz'
    },
    {
      title: 'Memory Usage',
      value: '58%',
      icon: Database,
      status: 'info',
      description: '32GB total'
    },
    {
      title: 'Storage',
      value: '1.2TB / 5TB',
      icon: HardDrive,
      status: 'info'
    },
    {
      title: 'Network',
      value: '2.4 Gbps',
      icon: Network,
      status: 'success',
      description: '1.2 Gbps in / 1.2 Gbps out'
    },
    {
      title: 'Security',
      value: 'All Systems Secure',
      icon: Shield,
      status: 'success'
    },
    {
      title: 'API Response',
      value: '32ms',
      icon: Zap,
      status: 'success',
      description: 'avg. response time'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${getStatusColor(metric.status || 'info')}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              )}
              {metric.trend && (
                <div className="mt-1">
                  <Badge 
                    variant={metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} 
                    {metric.trend === 'up' ? 'Up' : metric.trend === 'down' ? 'Down' : 'Stable'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default SystemMetrics;
