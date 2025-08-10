'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableCaption 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  Check, 
  X,
  Eye,
  EyeOff,
  Trash2,
  UserPlus,
  RefreshCw,
  SlidersHorizontal,
  Download, 
  Upload, 
  ChevronDown,
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  Lock,
  UserCheck,
  UserX
} from 'lucide-react';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

// Types
type UserRole = 'user' | 'admin' | 'salesperson' | 'verifier' | 'project_manager' | 'developer' | 'support';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationMembership {
  id: string;
  organization: Organization;
  role: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
  phone_number?: string;
  profile_picture?: string | null;
  organization?: Organization | null;
  organization_memberships?: OrganizationMembership[];
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}



// Define form schemas outside the component
const userFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  // Password is not needed in the form - will be auto-generated in the backend
  password: z.string().optional(),
  confirm_password: z.string().optional(),
  role: z.enum(['user', 'admin', 'salesperson', 'verifier', 'project_manager', 'developer', 'support']),
  organization_id: z.string().optional(),
  is_active: z.boolean().default(true)
});

// Extended validation schema that includes organization requirement for non-user roles
const userFormSchemaWithOrgValidation = userFormSchema.refine(
  (data) => data.role === 'user' ? true : !!data.organization_id,
  {
    message: 'Organization is required for this role',
    path: ['organization_id'],
  }
);

type UserFormValues = z.infer<typeof userFormSchemaWithOrgValidation>;

const ITEMS_PER_PAGE = 10;

// Define the UserManagementSection component
const UserManagementSection = () => {
  // State for organizations
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const { toast } = useToast();

  // Fetch organizations for the dropdown
  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await apiGet<ApiResponse<Organization>>('/org/organizations/');
      setOrganizations(response.results || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingOrgs(false);
    }
  }, [toast]);

  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);
  // State for users list and pagination
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // State for create user dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // State for user selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  

  
  // State for delete user
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Form instance
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchemaWithOrgValidation),
    defaultValues: {
      role: 'user',
      is_active: true,
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirm_password: '',
      organization_id: ''
    },
  });
  
  // Format date to a readable string
  const formatLastActive = useCallback((lastLogin: string | null): string => {
    if (!lastLogin) return 'Never';
    return new Date(lastLogin).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);
  
  // Get user's full name
  const getUserName = useCallback((user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  }, []);

  // Get user's status badge
  const getStatusBadge = useCallback((isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'} className="capitalize">
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  }, []);

  // Get user's role badge
  const getRoleBadge = useCallback((role?: string | null) => {
    const roleMap: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800',
      salesperson: 'bg-green-100 text-green-800',
      verifier: 'bg-yellow-100 text-yellow-800',
      project_manager: 'bg-indigo-100 text-indigo-800',
      developer: 'bg-pink-100 text-pink-800',
      support: 'bg-orange-100 text-orange-800'
    };
    
    const roleKey = role || 'user'; // Default to 'user' if role is not provided
    const displayName = roleKey ? roleKey.replace('_', ' ') : 'User';
    
    return (
      <Badge className={`${roleMap[roleKey] || 'bg-gray-100 text-gray-800'} capitalize`}>
        {displayName}
      </Badge>
    );
  }, []);

  // Get user's organization
  const getUserOrganization = useCallback((user: User): string => {
    if (user.organization) {
      return user.organization.name;
    }
    if (user.organization_memberships?.length) {
      return user.organization_memberships[0].organization.name;
    }
    return 'No organization';
  }, []);

  // Toggle user selection
  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers((prev: Set<string>) => {
      const newSelection = new Set(prev);
      if (newSelection.has(userId)) {
        newSelection.delete(userId);
      } else {
        newSelection.add(userId);
      }
      return newSelection;
    });
  }, []);

  // Toggle select all users on current page
  const toggleSelectAll = useCallback(() => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((user: User) => user.id)));
    }
  }, [selectedUsers.size, users]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        is_active: statusFilter === 'all' ? '' : (statusFilter === 'active' ? 'true' : 'false'),
        role: roleFilter === 'all' ? '' : roleFilter,
      });
      
      const response = await apiGet<ApiResponse<User>>(`/users/?${params.toString()}`);
      
      setUsers(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, roleFilter]);

  // Initial fetch and on filter change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle form submission
  const onSubmit = async (data: UserFormValues) => {
    setIsCreating(true);
    
    try {
      // Prepare the user data
      const userData: any = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        auto_generate_password: true,  // This will trigger password generation
      };
      
      // Only include organization_id if role is not 'user'
      if (data.role !== 'user' && data.organization_id) {
        userData.organization_id = data.organization_id;
      }
      
      // Use the main users endpoint for admin-created users
      const newUser = await apiPost('/users/', userData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Add new user to the list
      setUsers(prevUsers => [newUser as User, ...prevUsers]);
      
      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      form.reset();
      
      toast({
        title: 'Success',
        description: 'User created successfully. A welcome email with login credentials has been sent to the user.',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle user status toggle
  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await apiPut(`/users/${userId}/`, { is_active: isActive });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: isActive } : user
      ));
      
      toast({
        title: 'Success',
        description: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
      });
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      await apiDelete(`/users/${userId}/`);
      
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    const userIds = Array.from(selectedUsers);
    if (!userIds.length) return;

    try {
      switch (action) {
        case 'delete':
          const confirmed = await new Promise<boolean>((resolve) => {
            resolve(window.confirm(`Are you sure you want to delete ${userIds.length} users?`));
          });

          if (confirmed) {
            await Promise.all(
              userIds.map(userId => apiDelete(`/users/${userId}/`))
            );
            
            setUsers((prevUsers: User[]) => prevUsers.filter(user => !userIds.includes(user.id)));
            setSelectedUsers(new Set());
            
            toast({
              title: 'Success',
              description: `${userIds.length} users deleted successfully`,
            });
          }
          break;

        case 'activate':
          await Promise.all(
            userIds.map(userId => 
              apiPut(`/users/${userId}/`, { is_active: true })
            )
          );
          
          setUsers((prevUsers: User[]) => 
            prevUsers.map(user => 
              userIds.includes(user.id) 
                ? { ...user, is_active: true } 
                : user
            )
          );
          
          toast({
            title: 'Success',
            description: `${userIds.length} users activated successfully`,
          });
          break;

        case 'deactivate':
          await Promise.all(
            userIds.map(userId => 
              apiPut(`/users/${userId}/`, { is_active: false })
            )
          );
          
          setUsers((prevUsers: User[]) => 
            prevUsers.map(user => 
              userIds.includes(user.id) 
                ? { ...user, is_active: false } 
                : user
            )
          );
          
          toast({
            title: 'Success',
            description: `${userIds.length} users deactivated successfully`,
          });
          break;
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} users`,
        variant: 'destructive' as const
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage all users across all organizations
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" className="h-8">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" variant="outline" className="h-8">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button 
            size="sm" 
            className="h-8"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="salesperson">Salesperson</SelectItem>
                <SelectItem value="verifier">Verifier</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">
              {selectedUsers.size} user(s) selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedUsers.size > 0 && selectedUsers.size === users.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2">Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={user.profile_picture || ''} alt={getUserName(user) || 'User'} />
                          <AvatarFallback>
                            {(getUserName(user) || 'UU')
                              .split(' ')
                              .map((n: string) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{getUserName(user)}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusBadge(user.is_active)}
                      </div>
                    </TableCell>
                    <TableCell>{formatLastActive(user.last_login)}</TableCell>
                    <TableCell>{getUserOrganization(user)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusChange(user.id, !user.is_active)}>
                            {user.is_active ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-2 mt-4">
          <div className="text-sm text-muted-foreground">
            {selectedUsers.size > 0 ? (
              <span>{selectedUsers.size} of {users.length} row(s) selected</span>
            ) : (
              <span>Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, users.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, users.length)} of {users.length} users</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2">...</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will receive an email with login instructions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md bg-blue-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      A secure, random password will be automatically generated and sent to the user's email address.
                    </p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role <span className="text-destructive">*</span></FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset organization when role changes to user
                        if (value === 'user') {
                          form.setValue('organization_id', '');
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="salesperson">Salesperson</SelectItem>
                        <SelectItem value="verifier">Verifier</SelectItem>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

{form.watch('role') !== 'user' && (
  <FormField
    control={form.control}
    name="organization_id"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Organization</FormLabel>
        <Select 
          onValueChange={field.onChange} 
          value={field.value}
          disabled={!organizations.length}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
)}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active User</FormLabel>
                      <FormDescription>
                        User can log in and access the system
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Export the component as default
export default UserManagementSection;

// Export types for external use
export type { User, Organization };