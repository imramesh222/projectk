'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Eye,
  Shield,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const metrics = [
  {
    title: 'Pending Verifications',
    value: '23',
    change: '+5 today',
    changeType: 'neutral',
    icon: Clock,
  },
  {
    title: 'Completed Today',
    value: '18',
    change: '+12% vs yesterday',
    changeType: 'positive',
    icon: CheckCircle,
  },
  {
    title: 'Approval Rate',
    value: '87%',
    change: '+3% this week',
    changeType: 'positive',
    icon: Target,
  },
  {
    title: 'Avg Review Time',
    value: '12min',
    change: '-2min improvement',
    changeType: 'positive',
    icon: Clock,
  },
];

const verificationQueue = [
  { id: 'V-1234', type: 'Identity', submitter: 'John Smith', priority: 'high', submitted: '2 hours ago', complexity: 'medium' },
  { id: 'V-1235', type: 'Business', submitter: 'TechCorp Inc.', priority: 'critical', submitted: '30 min ago', complexity: 'high' },
  { id: 'V-1236', type: 'Address', submitter: 'Sarah Johnson', priority: 'medium', submitted: '1 hour ago', complexity: 'low' },
  { id: 'V-1237', type: 'Financial', submitter: 'Mike Davis', priority: 'high', submitted: '3 hours ago', complexity: 'high' },
  { id: 'V-1238', type: 'Identity', submitter: 'Lisa Wilson', priority: 'low', submitted: '4 hours ago', complexity: 'low' },
];

const verificationStats = [
  { type: 'Identity', pending: 8, approved: 45, rejected: 3 },
  { type: 'Business', pending: 5, approved: 23, rejected: 2 },
  { type: 'Address', pending: 6, approved: 67, rejected: 1 },
  { type: 'Financial', pending: 4, approved: 34, rejected: 5 },
];

const dailyActivityData = [
  { day: 'Mon', approved: 12, rejected: 2, pending: 8 },
  { day: 'Tue', approved: 15, rejected: 3, pending: 6 },
  { day: 'Wed', approved: 18, rejected: 1, pending: 9 },
  { day: 'Thu', approved: 14, rejected: 4, pending: 7 },
  { day: 'Fri', approved: 16, rejected: 2, pending: 5 },
];

const accuracyData = [
  { week: 'W1', accuracy: 85 },
  { week: 'W2', accuracy: 88 },
  { week: 'W3', accuracy: 87 },
  { week: 'W4', accuracy: 91 },
];

const recentDecisions = [
  { id: 'V-1230', type: 'Identity', decision: 'approved', reason: 'All documents valid', time: '5 min ago' },
  { id: 'V-1231', type: 'Business', decision: 'rejected', reason: 'Incomplete registration', time: '15 min ago' },
  { id: 'V-1232', type: 'Address', decision: 'approved', reason: 'Address verified', time: '25 min ago' },
  { id: 'V-1233', type: 'Financial', decision: 'approved', reason: 'Bank statements valid', time: '35 min ago' },
];

export function VerifierOverview() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Identity': return <Shield className="h-4 w-4" />;
      case 'Business': return <FileText className="h-4 w-4" />;
      case 'Address': return <Eye className="h-4 w-4" />;
      case 'Financial': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verifier Dashboard</h1>
        <p className="mt-2 text-gray-600">Review and verify submitted documents and information</p>
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
                metric.changeType === 'positive' ? 'text-green-600' : 
                metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.changeType === 'positive' && <TrendingUp className="h-3 w-3 mr-1" />}
                {metric.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Verification Queue
          </CardTitle>
          <CardDescription>Items awaiting your review and verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verificationQueue.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{item.id}</span>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      <Badge className={getComplexityColor(item.complexity)}>
                        {item.complexity}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{item.type} Verification</p>
                    <p className="text-sm text-gray-500">{item.submitter}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400">{item.submitted}</span>
                  <Button size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View Full Queue
          </Button>
        </CardContent>
      </Card>

      {/* Daily Activity and Accuracy Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Verification Activity</CardTitle>
            <CardDescription>Your verification decisions this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="approved" fill="#10B981" name="Approved" />
                <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Accuracy</CardTitle>
            <CardDescription>Your accuracy rate over the past month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[80, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Verification Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Statistics by Type</CardTitle>
          <CardDescription>Current status breakdown by verification type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {verificationStats.map((stat) => (
              <div key={stat.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(stat.type)}
                    <span className="text-sm font-medium text-gray-900">{stat.type}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Pending: {stat.pending}</span>
                    <span>Approved: {stat.approved}</span>
                    <span>Rejected: {stat.rejected}</span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <div 
                    className="h-2 bg-yellow-400 rounded-l" 
                    style={{ width: `${(stat.pending / (stat.pending + stat.approved + stat.rejected)) * 100}%` }}
                  />
                  <div 
                    className="h-2 bg-green-500" 
                    style={{ width: `${(stat.approved / (stat.pending + stat.approved + stat.rejected)) * 100}%` }}
                  />
                  <div 
                    className="h-2 bg-red-500 rounded-r" 
                    style={{ width: `${(stat.rejected / (stat.pending + stat.approved + stat.rejected)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Decisions and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Recent Decisions
            </CardTitle>
            <CardDescription>Your latest verification decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDecisions.map((decision) => (
                <div key={decision.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      {getTypeIcon(decision.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">{decision.id}</span>
                        <Badge className={getDecisionColor(decision.decision)}>
                          {decision.decision}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{decision.reason}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{decision.time}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View Decision History
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used verification tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-20 flex-col space-y-2">
                <Eye className="h-6 w-6" />
                <span>Next Review</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <CheckCircle className="h-6 w-6" />
                <span>Bulk Approve</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <XCircle className="h-6 w-6" />
                <span>Flag Issue</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span>Guidelines</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <Target className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-800">High Accuracy!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">91% accuracy rate this month</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-800">Fast Reviews</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">12min average review time</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-800">Productive Day</span>
              </div>
              <p className="text-sm text-purple-600 mt-1">18 verifications completed today</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}