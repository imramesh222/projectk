'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Users, Clock, Activity, Plus } from 'lucide-react';
import { fetchOrganizationDetails, fetchOrganizationAdminDashboard } from '@/services/organizationService';
import { getAccessToken, getCurrentUserWithFallback } from '@/lib/auth';
import type { Organization, OrganizationDashboardData } from '@/types/organization';
import type { User } from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, isLoading }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

interface OrganizationDashboardProps {
  orgId: string;
}

export default function OrganizationDashboard({ orgId }: OrganizationDashboardProps) {
  const { toast } = useToast();
  const params = useParams<{ orgId: string }>();
  const router = useRouter();
  const [data, setData] = useState<OrganizationDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orgName, setOrgName] = useState('Your Organization');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load current user on component mount
  useEffect(() => {
    const user = getCurrentUserWithFallback() as unknown as User | null;
    if (user) {
      setCurrentUser(user);
    } else {
      router.push('/login');
    }
  }, [router]);

  // Track if we've already tried to load data
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load organization data
  useEffect(() => {
    // Skip if we've already loaded or are already loading
    if (hasLoaded || !currentUser || !orgId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setHasLoaded(true);
        
        // First get the organization details
        const organization = await fetchOrganizationDetails(orgId);
        setOrgName(organization.name || 'Organization');
        
        // Then get the dashboard data
        const dashboardData = await fetchOrganizationAdminDashboard(orgId);
        setData(dashboardData);
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
        
        // Handle 403 Forbidden (unauthorized) specifically
        if (error.response?.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this organization dashboard',
            type: 'destructive',
          });
          router.push('/dashboard');
          return;
        }
        
        // Handle other errors
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          type: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [orgId, router, toast, currentUser, hasLoaded]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{orgName} Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.first_name || 'Organization Admin'}
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/organization/${params.orgId}/projects/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Members"
          value={data?.metrics.totalMembers.toLocaleString() || '0'}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Projects"
          value={data?.metrics.activeProjects.toString() || '0'}
          icon={Activity}
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${data?.metrics.monthlyRevenue.toLocaleString() || '0'}`}
          icon={Clock}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
