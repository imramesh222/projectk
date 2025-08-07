'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableCaption
} from '@/components/ui/table';
import { 
  Input 
} from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Search, 
  UserPlus, 
  Download, 
  Upload, 
  Filter, 
  ChevronDown,
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  Lock,
  Trash2,
  UserCheck,
  UserX,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';

// Types
type UserRole = 'user' | 'admin' | 'salesperson' | 'verifier' | 'project_manager' | 'developer' | 'support';

type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

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
  organization?: {
    id: string;
    name: string;
  } | null;
  organization_memberships?: Array<{
    id: string;
    organization: {
      id: string;
      name: string;
    };
    role: string;
  }>;
}

interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const ITEMS_PER_PAGE = 10;

export function UserManagementSection() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Build query params
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: ITEMS_PER_PAGE.toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter !== 'all' && { is_active: statusFilter === 'active' ? 'true' : 'false' }),
          ...(roleFilter !== 'all' && { role: roleFilter })
        });

        const response = await apiGet<ApiResponse<User>>(`users/?${params.toString()}`);
        
        setUsers(response.results);
        setTotalPages(Math.ceil(response.count / ITEMS_PER_PAGE));
      } catch (error: any) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
        toast({
          title: 'Error',
          description: error.message || 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, searchTerm, statusFilter, roleFilter, toast]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when search term changes
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle user status change
  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const updatedUser = await apiPut<User>(`users/${userId}/`, { is_active: isActive });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: updatedUser.is_active } : user
      ));
      
      toast({
        title: 'Success',
        description: `User has been ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiDelete(`users/${userId}/`);
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: 'Success',
        description: 'User has been deleted',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return;
    
    try {
      const userIds = Array.from(selectedUsers);
      
      if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${userIds.length} selected users? This action cannot be undone.`)) {
          return;
        }
        
        // Delete users in parallel
        await Promise.all(
          userIds.map(userId => apiDelete(`users/${userId}/`))
        );
        
        setUsers(users.filter(user => !userIds.includes(user.id)));
        setSelectedUsers(new Set());
        
        toast({
          title: 'Success',
          description: `${userIds.length} users have been deleted`,
        });
      } else if (action === 'activate' || action === 'deactivate') {
        const isActive = action === 'activate';
        
        // Update users in parallel
        await Promise.all(
          userIds.map(userId => 
            apiPut(`users/${userId}/`, { is_active: isActive })
          )
        );
        
        setUsers(users.map(user => 
          userIds.includes(user.id) ? { ...user, is_active: isActive } : user
        ));
        
        toast({
          title: 'Success',
          description: `${userIds.length} users have been ${isActive ? 'activated' : 'deactivated'}`,
        });
      }
      
      setIsBulkActionOpen(false);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast({
        title: 'Error',
        description: `Failed to perform bulk action: ${action}`,
        variant: 'destructive',
      });
    }
  };

  // Handle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  // Toggle select all on current page
  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      const newSelection = new Set<string>();
      users.forEach(user => newSelection.add(user.id));
      setSelectedUsers(newSelection);
    }
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      user: 'User',
      salesperson: 'Salesperson',
      verifier: 'Verifier',
      project_manager: 'Project Manager',
      developer: 'Developer',
      support: 'Support',
    };
    
    const colorMap: Record<string, string> = {
      admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      user: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      salesperson: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      verifier: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      project_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      developer: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      support: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[role] || 'bg-gray-100 text-gray-800'}`}>
        {roleMap[role] || role}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get user's full name
  const getUserName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email.split('@')[0];
  };
  
  // Get user's organization
  const getUserOrganization = (user: User) => {
    if (user.organization) {
      return user.organization.name;
    }
    if (user.organization_memberships?.length) {
      return user.organization_memberships[0].organization.name;
    }
    return 'No organization';
  };

  // Format last active
  const formatLastActive = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
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
          <Button size="sm" className="h-8">
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
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
              <SelectItem value="pending">Pending</SelectItem>
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
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedUsers.size > 0 && selectedUsers.size === users.length}
                  onChange={toggleSelectAll}
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
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={user.profile_picture || ''} alt={getUserName(user)} />
                        <AvatarFallback>
                          {getUserName(user)
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')}
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
  </Card>
  );
}
