// 'use client';

// import { useEffect, useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { MetricCard } from '../common/MetricCard';
// import { 
//   Users, 
//   FolderOpen, 
//   DollarSign, 
//   TrendingUp,
//   Calendar,
//   Clock,
//   AlertCircle,
//   Loader2
// } from 'lucide-react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// import { fetchOrganizationAdminDashboard } from '@/services/organizationService';
// import { format } from 'date-fns';
// import { LucideIcon } from 'lucide-react';

// // Define the API response type since we're not using the one from organizationService
// type ApiDashboardMetrics = {
//   total_members: number;
//   active_members: number;
//   total_projects: number;
//   active_projects: number;
//   pending_tasks: number;
//   completed_tasks: number;
//   monthly_revenue: number;
//   total_revenue: number;
//   pending_invoices: number;
//   overdue_invoices: number;
//   storage_usage: number;
//   storage_limit: number;
//   member_activity: Array<{ date: string; active: number; new: number }>;
//   project_status: Array<{ status: string; count: number; color: string }>;
// };

// type ApiDashboardResponse = {
//   metrics: ApiDashboardMetrics;
//   recent_activities: Array<{
//     id: string;
//     action: string;
//     user_name: string;
//     timestamp: string;
//   }>;
//   projects: any[];
//   upcoming_deadlines: any[];
//   team_members: any[];
// };

// // Extend the base dashboard data with any additional client-side properties
// interface DashboardData {
//   metrics: {
//     totalMembers: number;
//     activeMembers: number;
//     totalProjects: number;
//     activeProjects: number;
//     pendingTasks: number;
//     completedTasks: number;
//     monthlyRevenue: number;
//     totalRevenue: number;
//     pendingInvoices: number;
//     overdueInvoices: number;
//     storageUsage: number;
//     storageLimit: number;
//     memberActivity: Array<{ date: string; active: number; new: number }>;
//     projectStatus: Array<{ status: string; count: number; color: string }>;
//   };
//   recentActivities: Array<{
//     id: string;
//     action: string;
//     userName: string;
//     timestamp: string;
//     user: string;
//     time: string;
//   }>;
//   projects: any[];
//   upcomingDeadlines: any[];
//   memberActivity: Array<{ date: string; active: number; new: number }>;
//   teamMembers: any[];
// }

// // MetricCard has been moved to shared components

// interface AdminOverviewProps {
//   orgId: string;
// }

// export const AdminOverview: React.FC<AdminOverviewProps> = ({ orgId }) => {
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [dashboardData, setDashboardData] = useState<DashboardData>({
//     metrics: {
//       totalMembers: 0,
//       activeMembers: 0,
//       totalProjects: 0,
//       activeProjects: 0,
//       pendingTasks: 0,
//       completedTasks: 0,
//       monthlyRevenue: 0,
//       totalRevenue: 0,
//       pendingInvoices: 0,
//       overdueInvoices: 0,
//       storageUsage: 0,
//       storageLimit: 0,
//       memberActivity: [],
//       projectStatus: []
//     },
//     recentActivities: [],
//     projects: [],
//     upcomingDeadlines: [],
//     memberActivity: [],
//     teamMembers: []
//   });

//   const { metrics } = dashboardData;

//   const getChangePercentage = (current: number, previous: number): string => {
//     if (previous === 0) return '0%';
//     const change = ((current - previous) / previous) * 100;
//     return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
//   };

//   const metricCards = [
//     {
//       title: 'Total Members',
//       value: metrics.totalMembers.toString(),
//       icon: <Users className="h-4 w-4 text-muted-foreground" />,
//       trend: {
//         value: getChangePercentage(metrics.totalMembers, Math.max(0, metrics.totalMembers - 5)),
//         type: 'up' as const,
//       }
//     },
//     {
//       title: 'Active Projects',
//       value: `${metrics.activeProjects}/${metrics.totalProjects}`,
//       icon: <FolderOpen className="h-4 w-4 text-muted-foreground" />,
//       trend: {
//         value: getChangePercentage(metrics.activeProjects, Math.max(0, metrics.activeProjects - 2)),
//         type: metrics.activeProjects > 0 ? 'up' as const : 'neutral' as const,
//       }
//     },
//     {
//       title: 'Monthly Revenue',
//       value: `$${metrics.monthlyRevenue.toLocaleString()}`,
//       icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
//       trend: {
//         value: getChangePercentage(metrics.monthlyRevenue || 0, Math.max(0, (metrics.monthlyRevenue || 0) - 1000)),
//         type: metrics.monthlyRevenue > 0 ? 'up' as const : 'neutral' as const,
//       }
//     },
//     {
//       title: 'Storage Usage',
//       value: `${((metrics.storageUsage / (metrics.storageLimit || 1)) * 100).toFixed(1)}%`,
//       icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
//       trend: {
//         value: getChangePercentage(metrics.storageUsage, Math.max(0, metrics.storageUsage - 10)),
//         type: (metrics.storageUsage / (metrics.storageLimit || 1)) > 0.9 ? 'down' as const : 'neutral' as const,
//       }
//     },
//     {
//       title: 'Pending Tasks',
//       value: metrics.pendingTasks.toString(),
//       icon: <Clock className="h-4 w-4 text-muted-foreground" />,
//       trend: {
//         value: `+${metrics.pendingTasks} this week`,
//         type: metrics.pendingTasks > 0 ? 'down' as const : 'neutral' as const,
//       }
//     },
//   ];

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         setLoading(true);
//         const response = await fetchOrganizationAdminDashboard(orgId);
//         const data = response as unknown as ApiDashboardResponse;
        
//         // Transform the data to match our DashboardData interface
//         const transformedData: DashboardData = {
//           metrics: {
//             totalMembers: data.metrics?.total_members || 0,
//             activeMembers: data.metrics?.active_members || 0,
//             totalProjects: data.metrics?.total_projects || 0,
//             activeProjects: data.metrics?.active_projects || 0,
//             pendingTasks: data.metrics?.pending_tasks || 0,
//             completedTasks: data.metrics?.completed_tasks || 0,
//             monthlyRevenue: data.metrics?.monthly_revenue || 0,
//             totalRevenue: data.metrics?.total_revenue || 0,
//             pendingInvoices: data.metrics?.pending_invoices || 0,
//             overdueInvoices: data.metrics?.overdue_invoices || 0,
//             storageUsage: data.metrics?.storage_usage || 0,
//             storageLimit: data.metrics?.storage_limit || 1,
//             memberActivity: data.metrics?.member_activity || [],
//             projectStatus: data.metrics?.project_status || []
//           },
//           recentActivities: (data.recent_activities || []).map((activity) => ({
//             ...activity,
//             id: activity.id,
//             action: activity.action,
//             user: activity.user_name || 'System',
//             time: format(new Date(activity.timestamp), 'MMM d, yyyy HH:mm'),
//             userName: activity.user_name,
//             timestamp: activity.timestamp
//           })),
//           projects: data.projects || [],
//           upcomingDeadlines: data.upcoming_deadlines || [],
//           memberActivity: data.metrics?.member_activity || [],
//           teamMembers: data.team_members || []
//         };
        
//         setDashboardData(transformedData);
//       } catch (err) {
//         console.error('Error loading dashboard data:', err);
//         setError('Failed to load dashboard data. Please try again later.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [orgId]);
  
//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="rounded-md bg-red-50 p-4">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
//             </div>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
//               <div className="mt-2 text-sm text-red-700">
//                 <p>{error}</p>
//               </div>
//               <div className="mt-4">
//                 <Button
//                   variant="outline"
//                   onClick={() => window.location.reload()}
//                   className="text-red-800 hover:bg-red-100"
//                 >
//                   Try again
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   return (
//     <div className="p-6 space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">Organization Overview</h1>
//         <p className="mt-2 text-gray-600">Monitor your organization's performance and manage your team</p>
//       </div>

//       {/* Metrics Grid */}
//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         {metricCards.map((card, index) => (
//           <MetricCard
//             key={index}
//             title={card.title}
//             value={card.value}
//             trend={card.trend}
//             icon={card.icon}
//             className="hover:shadow-lg transition-shadow duration-200"
//           />
//         ))}
//       </div>

//       {/* Charts Row */}
//       <div className="grid gap-4 md:grid-cols-2">
//         {/* Member Activity Chart */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Member Activity</CardTitle>
//             <CardDescription>Active and new members over time</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="h-[300px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={dashboardData.memberActivity}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="date" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line type="monotone" dataKey="active" stroke="#8884d8" />
//                   <Line type="monotone" dataKey="new" stroke="#82ca9d" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Project Status Chart */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Project Status</CardTitle>
//             <CardDescription>Distribution of projects by status</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="h-[300px] flex items-center justify-center">
//               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//                 <MetricCard
//                   title="Total Members"
//                   value={dashboardData.metrics.totalMembers.toString()}
//                   trend={{
//                     value: "+12% from last month",
//                     type: 'up'
//                   }}
//                   icon={<Users className="h-4 w-4 text-muted-foreground" />}
//                   className="hover:shadow-lg transition-shadow duration-200"
//                 />
//                 <MetricCard
//                   title="Active Projects"
//                   value={`${dashboardData.metrics.activeProjects}/${dashboardData.metrics.totalProjects}`}
//                   trend={{
//                     value: "+5 this week",
//                     type: 'up'
//                   }}
//                   icon={<FolderOpen className="h-4 w-4 text-muted-foreground" />}
//                   className="hover:shadow-lg transition-shadow duration-200"
//                 />
//                 <MetricCard
//                   title="Monthly Revenue"
//                   value={`$${dashboardData.metrics.monthlyRevenue.toLocaleString()}`}
//                   trend={{
//                     value: "+8.2% from last month",
//                     type: 'up'
//                   }}
//                   icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
//                   className="hover:shadow-lg transition-shadow duration-200"
//                 />
//                 <MetricCard
//                   title="Pending Tasks"
//                   value={dashboardData.metrics.pendingTasks.toString()}
//                   trend={{
//                     value: "-3 today",
//                     type: 'down'
//                   }}
//                   icon={<Clock className="h-4 w-4 text-muted-foreground" />}
//                   className="hover:shadow-lg transition-shadow duration-200"
//                 />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Recent Activity */}
//       <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle>Recent Activity</CardTitle>
//               <CardDescription>Latest actions in your organization</CardDescription>
//             </div>
//             <Button variant="outline" size="sm">
//               View All
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <div className="h-[200px] flex items-center justify-center">
//               <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
//             </div>
//           ) : dashboardData.recentActivities.length > 0 ? (
//             <div className="space-y-4">
//               {dashboardData.recentActivities.map((activity) => (
//                 <div key={activity.id} className="flex items-start pb-4 border-b last:border-0 last:pb-0">
//                   <div className="flex-shrink-0 mr-3">
//                     <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
//                       <Users className="h-5 w-5 text-gray-500" />
//                     </div>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-gray-900 truncate">
//                       {activity.user}
//                     </p>
//                     <p className="text-sm text-gray-500">
//                       {activity.action}
//                     </p>
//                   </div>
//                   <div className="ml-4 flex-shrink-0">
//                     <p className="text-sm text-gray-500">
//                       {activity.time}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="h-[200px] flex items-center justify-center text-gray-500">
//               No recent activities
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Quick Actions */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Quick Actions</CardTitle>
//           <CardDescription>Frequently used administrative functions</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-2 gap-4">
//             <Button className="h-20 flex-col space-y-2">
//               <Users className="h-6 w-6" />
//               <span>Add Member</span>
//             </Button>
//             <Button variant="outline" className="h-20 flex-col space-y-2">
//               <FolderOpen className="h-6 w-6" />
//               <span>New Project</span>
//             </Button>
//             <Button variant="outline" className="h-20 flex-col space-y-2">
//               <Calendar className="h-6 w-6" />
//               <span>Schedule Meeting</span>
//             </Button>
//             <Button variant="outline" className="h-20 flex-col space-y-2">
//               <DollarSign className="h-6 w-6" />
//               <span>View Billing</span>
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Alerts and Notifications */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center">
//             <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
//             Important Alerts
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
//               <div className="flex items-center space-x-3">
//                 <AlertCircle className="h-5 w-5 text-amber-500" />
//                 <div>
//                   <p className="text-sm font-medium text-amber-800">Billing reminder</p>
//                   <p className="text-sm text-amber-600">Your subscription expires in 7 days</p>
//                 </div>
//               </div>
//               <Button size="sm" variant="outline">
//                 Renew Now
//               </Button>
//             </div>
//             <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
//               <div className="flex items-center space-x-3">
//                 <Users className="h-5 w-5 text-blue-500" />
//                 <div>
//                   <p className="text-sm font-medium text-blue-800">Team capacity</p>
//                   <p className="text-sm text-blue-600">You're approaching your member limit (156/200)</p>
//                 </div>
//               </div>
//               <Button size="sm" variant="outline">
//                 Upgrade Plan
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };