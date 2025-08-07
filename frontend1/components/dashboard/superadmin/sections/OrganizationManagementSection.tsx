'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Building2, Users, HardDrive, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';

// Helper function to format bytes to human-readable format
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
import { DataTable, type DataTableColumnDef } from '@/components/dashboard/common';
import { Input } from '@/components/ui/input';
import { fetchOrganizations, type OrganizationListItem } from '@/services/organizationService';
import { Skeleton } from '@/components/ui/skeleton';

// Import the Organization type from the types file
import type { Organization } from '@/types/organization';

const getStatusBadge = (status: Organization['status']) => {
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

const getPlanBadge = (plan: 'free' | 'basic' | 'pro' | 'enterprise') => {
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
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { organizations: data, total } = await fetchOrganizations({
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          search: searchQuery,
          status: statusFilter,
          sortBy: 'created_at',
          sortOrder: 'desc',
        });
        
        setOrganizations(data);
        setTotalItems(total);
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

    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [pagination, searchQuery, statusFilter, toast]);

  // Handle pagination change
  const handlePaginationChange = (pageIndex: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageIndex,
      pageSize,
    }));
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

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
      accessorKey: 'member_count',
      header: 'Members',
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="px-2 py-1">
            {row.original.member_count}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'storage_used',
      header: 'Storage',
      cell: ({ row }) => {
        const used = row.original.storage_used || 0;
        const total = row.original.storage_limit || 1;
        const percentage = Math.round((used / total) * 100);
        return (
          <div className="w-full">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{formatBytes(used)}</span>
              <span>{formatBytes(total)}</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        );
      },
    },
    {
      accessorKey: 'last_active',
      header: 'Last Active',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.last_active), { addSuffix: true })}
        </div>
      ),
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
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-medium">Organizations</CardTitle>
            <CardDescription>Manage all organizations in the system</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                className="pl-9 w-[200px] lg:w-[300px]"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  {statusFilter ? `Status: ${statusFilter}` : 'Filter by status'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusFilterChange('')}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilterChange('active')}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilterChange('trial')}>
                  Trial
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilterChange('suspended')}>
                  Suspended
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilterChange('inactive')}>
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && organizations.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-destructive-foreground bg-destructive/10 p-4 rounded-full mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium mb-1">Failed to load organizations</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {error.message || 'An unexpected error occurred'}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No organizations found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery || statusFilter
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding a new organization'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={organizations}
            isLoading={isLoading}
            error={error}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPaginationChange={handlePaginationChange}
            pageCount={Math.ceil(totalItems / pagination.pageSize)}
          />
        )}
      </CardContent>
    </Card>
  );
}
