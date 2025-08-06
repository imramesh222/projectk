'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Building2, Users, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { DataTable, type DataTableColumnDef } from '@/components/dashboard/common';

type OrganizationStatus = 'active' | 'trial' | 'suspended' | 'inactive';
type BillingPlan = 'free' | 'basic' | 'pro' | 'enterprise';

interface Organization {
  id: string;
  name: string;
  status: OrganizationStatus;
  plan: BillingPlan;
  memberCount: number;
  storageUsed: number;
  storageLimit: number;
  lastActive: string;
  owner: string;
}

const mockOrganizations: Organization[] = [
  { id: '1', name: 'Acme Corp', status: 'active', plan: 'enterprise', memberCount: 245, storageUsed: 245, storageLimit: 1000, lastActive: '2023-05-16T14:32:00Z', owner: 'John Doe' },
  { id: '2', name: 'Globex', status: 'trial', plan: 'pro', memberCount: 187, storageUsed: 198, storageLimit: 500, lastActive: '2023-05-16T10:15:00Z', owner: 'Jane Smith' },
  { id: '3', name: 'Initech', status: 'active', plan: 'basic', memberCount: 132, storageUsed: 345, storageLimit: 500, lastActive: '2023-05-15T16:45:00Z', owner: 'Bob Johnson' },
  { id: '4', name: 'Umbrella', status: 'suspended', plan: 'pro', memberCount: 98, storageUsed: 154, storageLimit: 500, lastActive: '2023-04-28T11:20:00Z', owner: 'Alice Williams' },
  { id: '5', name: 'Stark Ind', status: 'active', plan: 'enterprise', memberCount: 76, storageUsed: 876, storageLimit: 2000, lastActive: '2023-05-16T09:10:00Z', owner: 'Tony Stark' },
];

const getStatusBadge = (status: OrganizationStatus) => {
  switch (status) {
    case 'active':
      return <Badge variant="default">Active</Badge>;
    case 'trial':
      return <Badge variant="outline">Trial</Badge>;
    case 'suspended':
      return <Badge variant="destructive">Suspended</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getPlanBadge = (plan: BillingPlan) => {
  const planMap = {
    free: { label: 'Free', variant: 'bg-gray-100 text-gray-800' },
    basic: { label: 'Basic', variant: 'bg-blue-100 text-blue-800' },
    pro: { label: 'Pro', variant: 'bg-purple-100 text-purple-800' },
    enterprise: { label: 'Enterprise', variant: 'bg-amber-100 text-amber-800' },
  };
  const { label, variant } = planMap[plan] || { label: 'Unknown', variant: 'bg-gray-100' };
  return <span className={`text-xs px-2 py-1 rounded-full ${variant}`}>{label}</span>;
};

export function OrganizationManagementSection() {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setOrganizations(mockOrganizations);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load organizations');
        setError(error);
        toast({ 
          title: 'Error', 
          description: error.message, 
          variant: 'destructive' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Define columns
  const columns: DataTableColumnDef<Organization>[] = [
    {
      id: 'name',
      header: 'Organization',
      accessorKey: 'name',
      cell: (context) => {
        const row = context.row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <Building2 className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{row.name}</div>
              <div className="text-xs text-muted-foreground">{row.id}</div>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (context) => getStatusBadge(context.row.original.status),
      enableSorting: true,
    },
    {
      id: 'plan',
      header: 'Plan',
      accessorKey: 'plan',
      cell: (context) => getPlanBadge(context.row.original.plan),
      enableSorting: true,
    },
    {
      id: 'members',
      header: 'Members',
      accessorKey: 'memberCount',
      cell: (context) => {
        const row = context.row.original;
        return (
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            {row.memberCount}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: 'storage',
      header: 'Storage',
      accessorKey: 'storageUsed', // Use an existing property from Organization type
      cell: (context) => {
        const row = context.row.original;
        return (
          <div className="flex items-center">
            <HardDrive className="mr-2 h-4 w-4 text-muted-foreground" />
            {row.storageUsed}GB / {row.storageLimit}GB
          </div>
        );
      },
      // Disable sorting/filtering on this column since it's a composite value
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      id: 'lastActive',
      header: 'Last Active',
      accessorKey: 'lastActive',
      cell: (context) => formatDistanceToNow(new Date(context.row.original.lastActive), { addSuffix: true }),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (context) => {
        const row = context.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View organization</DropdownMenuItem>
              <DropdownMenuItem>Edit settings</DropdownMenuItem>
              <DropdownMenuItem>Manage members</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Suspend organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Organization Management</CardTitle>
          <CardDescription>Manage all organizations and their settings</CardDescription>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Organization
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={organizations}
          isLoading={isLoading}
          error={error}
          pageSize={10}
        />
      </CardContent>
    </Card>
  );
}
