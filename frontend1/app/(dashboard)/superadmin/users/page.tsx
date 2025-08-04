'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Download, Filter, UserPlus, User, ChevronDown } from 'lucide-react';

import { columns } from './columns';
import { apiGet, apiPost } from '@/lib/api-client';
import { UserWithDetails, Organization, OrganizationRole } from '@/types';

// Helper function to transform API response to UserWithDetails
const transformUserToUserWithDetails = (user: any): UserWithDetails => {
  // Transform organization memberships to match the expected type
  const orgMemberships = (user.organization_memberships || []).map((m: any) => ({
    id: m.id,
    is_active: m.is_active ?? true,
    joined_at: m.joined_at || new Date().toISOString(),
    roles: Array.isArray(m.roles) 
      ? m.roles.map((r: any) => ({
          id: typeof r === 'string' ? r : r.id || r.name,
          name: typeof r === 'string' ? r : r.name || r.id,
          permissions: [],
          organization: m.organization?.id || '',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      : [],
    organization: {
      id: m.organization?.id || '',
      name: m.organization?.name || 'Unknown Organization',
      email: m.organization?.email || '',
      phone: m.organization?.phone || '',
      is_active: m.organization?.is_active ?? true,
      member_count: m.organization?.member_count || 0,
      created_at: m.organization?.created_at || new Date().toISOString(),
      updated_at: m.organization?.updated_at || new Date().toISOString(),
      organization_roles: m.organization?.organization_roles || [],
      created_by: m.organization?.created_by || ''
    },
    added_by: m.added_by || undefined,
    last_updated: m.last_updated || new Date().toISOString()
  }));

  const now = new Date().toISOString();
  
  return {
    id: user.id || '',
    username: user.username || user.email?.split('@')[0] || `user_${Date.now()}`,
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role || 'user',
    is_active: user.is_active ?? true,
    is_staff: user.is_staff ?? false,
    is_superuser: user.is_superuser ?? false,
    last_login: user.last_login || null,
    date_joined: user.date_joined || now,
    created_at: user.created_at || now,
    updated_at: user.updated_at || now,
    organization_memberships: orgMemberships,
    phone_number: user.phone_number || '',
    profile_picture: user.profile_picture,
    bio: user.bio
  };
};

const GLOBAL_ROLES = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'user', label: 'User' },
];

interface NewUserData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin' | 'superadmin';
  password: string;
  organization_id?: string;
  send_invite: boolean;
  is_active?: boolean;
}

const handleRoleChange = (value: string) => {
  setNewUser(prev => ({
    ...prev,
    role: value as NewUserData['role']
  }));
};

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showOrgSelect, setShowOrgSelect] = useState(false);
  const [newUser, setNewUser] = useState<NewUserData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
    password: '',
    organization_id: undefined,
    send_invite: true,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await apiGet<any>('users/');
      // Ensure we're working with an array
      const usersData = Array.isArray(response) ? response : response?.results || [];
      // Transform each user to ensure it matches UserWithDetails type
      const transformedUsers = usersData.map(transformUserToUserWithDetails);
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Organization selection is not needed for global roles
  useEffect(() => {
    setShowOrgSelect(false);
  }, [newUser.role]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError('');

    // Validate required fields
    if (!newUser.email || !newUser.password || !newUser.username) {
      setCreateError('Email, password, and username are required');
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare user data
      const userData = { 
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.first_name || '',
        last_name: newUser.last_name || '',
        role: newUser.role,
        password: newUser.password,
        is_active: true,
        send_invite: true
      };

      // Make API call to register endpoint
      const response = await apiPost<any>('users/register/', userData);
      
      // Transform the response data to match UserWithDetails type
      const newUserWithDetails = transformUserToUserWithDetails(response.data);
      
      // Add the new user to the list
      setUsers(prevUsers => [...prevUsers, newUserWithDetails]);
      
      // Reset form
      setNewUser({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'user',
        password: '',
        organization_id: undefined,
        send_invite: true,
        is_active: true
      });
      
      // Close dialog
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to create user. Please try again.';
      setCreateError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user: UserWithDetails) => {
    if (!searchTerm) {
      // If no search term, only filter by status
      return statusFilter === 'all' || 
             (statusFilter === 'active' && user.is_active) ||
             (statusFilter === 'inactive' && !user.is_active);
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Safely check each field for matches
    const emailMatch = user.email?.toLowerCase().includes(searchLower) || false;
    const firstNameMatch = user.first_name?.toLowerCase().includes(searchLower) || false;
    const lastNameMatch = user.last_name?.toLowerCase().includes(searchLower) || false;
    const usernameMatch = user.username?.toLowerCase().includes(searchLower) || false;
    
    const matchesSearch = emailMatch || firstNameMatch || lastNameMatch || usernameMatch;
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
      
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Try again <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and their permissions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. They will receive an email with instructions to set their password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="col-span-3"
                    placeholder="johndoe"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="col-span-3"
                    placeholder="user@example.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="first_name" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    className="col-span-3"
                    placeholder="John"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="last_name" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    className="col-span-3"
                    placeholder="Doe"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="col-span-3"
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Global Role
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <Select
                      value={newUser.role}
                      onValueChange={(value: 'superadmin' | 'admin' | 'user') => 
                        setNewUser({...newUser, role: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {GLOBAL_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {newUser.role === 'superadmin' 
                        ? 'Full access to all organizations and system settings.'
                        : 'Standard user with limited permissions. Organization roles can be assigned after creation.'}
                    </p>
                  </div>
                </div>

                {/* Organization roles will be managed separately after user creation */}
                <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">
                  Organization roles can be assigned after user creation from the user details page.
                </div>
              </div>
              {createError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                  {createError}
                </div>
              )}
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
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-9 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active' : 'Inactive'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
                <span className="sr-only">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="all" className="mt-6">
              {filteredUsers.length > 0 ? (
                <DataTable<UserWithDetails, unknown>
                  columns={columns}
                  data={filteredUsers}
                  searchKey="email"
                  className="[&>div:first-child]:rounded-t-md [&>div:last-child]:rounded-b-md [&>div:last-child]:border-t [&>div:last-child]:border-gray-200 dark:[&>div:last-child]:border-gray-800"
                  headerClassName="bg-gray-50 dark:bg-gray-800/50"
                  rowClassName={({ index }) => 
                    index % 2 === 0 
                      ? 'bg-white dark:bg-gray-900' 
                      : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/70'
                  }
                />
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-muted-foreground">
                    <User className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium">No users found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search or ' : 'Get started by '}adding a new user.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
