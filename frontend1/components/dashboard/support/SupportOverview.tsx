'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Headphones, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Star,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const metrics = [
  {
    title: 'Open Tickets',
    value: '47',
    change: '-8 from yesterday',
    changeType: 'positive',
    icon: Headphones,
  },
  {
    title: 'Avg Response Time',
    value: '2.3h',
    change: '-15min improvement',
    changeType: 'positive',
    icon: Clock,
  },
  {
    title: 'Resolution Rate',
    value: '94%',
    change: '+2% this week',
    changeType: 'positive',
    icon: CheckCircle,
  },
  {
    title: 'Customer Satisfaction',
    value: '4.8/5',
    change: '+0.2 this month',
    changeType: 'positive',
    icon: Star,
  },
];

const ticketsByPriority = [
  { priority: 'Critical', count: 5, color: '#EF4444' },
  { priority: 'High', count: 12, color: '#F59E0B' },
  { priority: 'Medium', count: 18, color: '#3B82F6' },
  { priority: 'Low', count: 12, color: '#10B981' },
];

const ticketVolumeData = [
  { day: 'Mon', created: 15, resolved: 12 },
  { day: 'Tue', created: 22, resolved: 18 },
  { day: 'Wed', created: 18, resolved: 20 },
  { day: 'Thu', created: 25, resolved: 22 },
  { day: 'Fri', created: 20, resolved: 24 },
  { day: 'Sat', created: 8, resolved: 10 },
  { day: 'Sun', created: 6, resolved: 8 },
];

const responseTimeData = [
  { week: 'W1', avgTime: 3.2 },
  { week: 'W2', avgTime: 2.8 },
  { week: 'W3', avgTime: 2.5 },
  { week: 'W4', avgTime: 2.3 },
];

const recentTickets = [
  { id: 'T-1234', subject: 'Login issues with mobile app', customer: 'John Smith', priority: 'high', status: 'open', time: '5 min ago' },
  { id: 'T-1235', subject: 'Payment processing error', customer: 'Sarah Johnson', priority: 'critical', status: 'in-progress', time: '15 min ago' },
  { id: 'T-1236', subject: 'Feature request: Dark mode', customer: 'Mike Davis', priority: 'low', status: 'open', time: '1 hour ago' },
  { id: 'T-1237', subject: 'Account deletion request', customer: 'Lisa Wilson', priority: 'medium', status: 'pending', time: '2 hours ago' },
  { id: 'T-1238', subject: 'Integration documentation', customer: 'Tech Corp', priority: 'medium', status: 'resolved', time: '3 hours ago' },
];

const customerSatisfactionData = [
  { rating: '5 Stars', count: 45, percentage: 65 },
  { rating: '4 Stars', count: 18, percentage: 26 },
  { rating: '3 Stars', count: 4, percentage: 6 },
  { rating: '2 Stars', count: 2, percentage: 3 },
  { rating: '1 Star', count: 0, percentage: 0 },
];

export function SupportOverview() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-purple-600 bg-purple-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor support tickets and customer satisfaction</p>
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
                {metric.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ticket Volume and Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Volume Trends</CardTitle>
            <CardDescription>Daily ticket creation vs resolution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="created" fill="#3B82F6" name="Created" />
                <Bar dataKey="resolved" fill="#10B981" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
            <CardDescription>Current ticket distribution by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ticketsByPriority}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {ticketsByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {ticketsByPriority.map((entry) => (
                <div key={entry.priority} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.priority} ({entry.count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Average Response Time</CardTitle>
          <CardDescription>Weekly average response time trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}h`, 'Avg Response Time']} />
              <Line type="monotone" dataKey="avgTime" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Tickets and Customer Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Recent Tickets
            </CardTitle>
            <CardDescription>Latest support tickets requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{ticket.id}</span>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                    <p className="text-sm text-gray-500">{ticket.customer}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('-', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-400">{ticket.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Tickets
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Customer Satisfaction
            </CardTitle>
            <CardDescription>Customer feedback ratings this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerSatisfactionData.map((rating) => (
                <div key={rating.rating} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{rating.rating}</span>
                    <span className="text-sm text-gray-500">{rating.count} reviews</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={rating.percentage} className="flex-1" />
                    <span className="text-sm text-gray-500 w-12">{rating.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">Excellent Performance!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">91% of customers rated 4+ stars</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used support tools and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2">
              <MessageSquare className="h-6 w-6" />
              <span>New Ticket</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Customer Lookup</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Phone className="h-6 w-6" />
              <span>Call Customer</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Mail className="h-6 w-6" />
              <span>Send Update</span>
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
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">Great Resolution Rate!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">94% of tickets resolved successfully</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-800">Fast Response</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">2.3h average response time</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-800">High Satisfaction</span>
              </div>
              <p className="text-sm text-purple-600 mt-1">4.8/5 average customer rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}