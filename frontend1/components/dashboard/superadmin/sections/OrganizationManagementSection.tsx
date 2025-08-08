'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
import { fetchOrganizations, createOrganization, type OrganizationListItem } from '@/services/organizationService';
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

// Form schema for organization creation
const organizationFormSchema = z.object({
  // Basic Information
  name: z.string().min(2, {
    message: 'Organization name must be at least 2 characters.',
  }),
  slug: z.string().min(2, {
    message: 'Slug must be at least 2 characters.',
  }).regex(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens.',
  }),
  
  // Contact Information
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }).min(1, {
    message: 'Email is required.',
  }),
  phone_number: z.string().optional(),
  website: z.string().url({
    message: 'Please enter a valid URL including http:// or https://',
  }).optional().or(z.literal('')),
  
  // Plan & Status
  status: z.enum(['active', 'trial', 'suspended', 'inactive']),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']),
  
  // Limits
  max_users: z.number().min(1, {
    message: 'Maximum users must be at least 1.',
  }),
  max_storage: z.number().min(1, {
    message: 'Maximum storage must be at least 1GB.',
  }),
  
  // Description
  description: z.string().optional(),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      email: '',
      slug: '',
      status: 'active',
      plan: 'free',
      max_users: 10,
      max_storage: 10,
      description: '',
      phone_number: '',
      website: '',
    },
  });

  // Handle organization creation
  const handleCreateOrganization = async (values: OrganizationFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Call the createOrganization service
      const newOrg = await createOrganization({
        name: values.name,
        email: values.email, // Include the email field
        slug: values.slug,
        status: values.status,
        plan: values.plan,
        max_users: values.max_users,
        max_storage: values.max_storage,
        description: values.description,
        phone_number: values.phone_number || '',
        website: values.website || '',
      });

      // Show success message
      toast({
        title: 'Organization created',
        description: `${newOrg.name} has been created successfully.`,
        variant: 'default',
      });

      // Close the dialog and reset the form
      setIsCreateDialogOpen(false);
      form.reset();

      // Refresh the organizations list
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
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Organization
                </Button>
              </DialogTrigger>
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
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Organization
                </Button>
              </DialogTrigger>
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

      {/* Add Organization Dialog */}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Add a new organization to the platform. Fill in the required information and click create.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateOrganization)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@example.com" type="email" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      Include https:// in the URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2 whitespace-nowrap">
                        {typeof window !== 'undefined' ? window.location.hostname.split('.')[0] : 'app'}.example.com/
                      </span>
                      <Input placeholder="acme-inc" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    A unique identifier for the organization's URL.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_users"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Users</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_storage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Storage (GB)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief description of the organization..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
