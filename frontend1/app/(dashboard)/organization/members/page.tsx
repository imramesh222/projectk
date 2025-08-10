'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Plus, UserPlus, Loader2, MoreHorizontal } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { toast, useToast } from '@/hooks/use-toast';
import { AddMemberForm } from '@/components/organization/AddMemberForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

import { getCurrentUser } from '@/lib/auth';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/apiService';

// Types
export type OrganizationRole = 'admin' | 'developer' | 'project_manager' | 'support' | 'verifier' | 'salesperson' | 'client' | 'member';

export type Member = {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  joinedAt: string;
  avatar?: string;
};

type StatusVariant = 'active' | 'inactive' | 'suspended';

const statusVariants: Record<StatusVariant, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', color: 'bg-yellow-100 text-yellow-800' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800' },
};

const roleVariants: Record<OrganizationRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  developer: 'bg-blue-100 text-blue-800',
  project_manager: 'bg-green-100 text-green-800',
  support: 'bg-yellow-100 text-yellow-800',
  verifier: 'bg-indigo-100 text-indigo-800',
  salesperson: 'bg-teal-100 text-teal-800',
  client: 'bg-gray-100 text-gray-800',
  member: 'bg-gray-100 text-gray-800',
};

// Map role to display name and color
const getRoleInfo = (role: OrganizationRole) => {
  const roleMap: Record<OrganizationRole, { name: string; color: string }> = {
    admin: { name: 'Admin', color: roleVariants.admin },
    developer: { name: 'Developer', color: roleVariants.developer },
    project_manager: { name: 'Project Manager', color: roleVariants.project_manager },
    support: { name: 'Support', color: roleVariants.support },
    verifier: { name: 'Verifier', color: roleVariants.verifier },
    salesperson: { name: 'Sales', color: roleVariants.salesperson },
    client: { name: 'Client', color: roleVariants.client },
    member: { name: 'Member', color: roleVariants.member },
  };
  
  return roleMap[role] || { name: role, color: 'bg-gray-100 text-gray-800' };
};

export default function OrganizationMembersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

    // Fetch organization members from the backend
  useEffect(() => {
    const fetchMembers = async () => {
    try {
      setIsLoading(true);
      
      // Get the current user's organization memberships
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // First, get the user's organization memberships
      const membershipsResponse = await apiGet(`/organization-members/?user=${currentUser.id}`);
      const memberships = membershipsResponse.data || [];
      
      if (memberships.length === 0) {
        throw new Error('No organization memberships found for the current user');
      }
      
      // Use the first organization membership (or implement logic to select the correct one)
      const organizationId = memberships[0].organization.id;
      
      // Now fetch the members for this organization using the correct endpoint
      const membersResponse = await apiGet(`/organizations/${organizationId}/members/`);
      const data = membersResponse.data || [];
      
          // Transform the API response to match our Member type
      const transformedMembers: Member[] = data.map((member: Omit<Member, 'id'> & { id: string | number }) => ({
          ...member,
          status: member.status as 'active' | 'inactive' | 'suspended',
          lastActive: member.lastActive || new Date().toISOString(),
          joinedAt: member.joinedAt || new Date().toISOString(),
          roleName: getRoleInfo(member.role).name,
          // Add a default avatar based on the first letter of the name
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'U')}&background=random`,
        }));
        
        setMembers(transformedMembers);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast({
          title: 'Error',
          description: 'Failed to load organization members. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMembers();
  }, [toast]);

  const handleAddMember = async () => {
    setIsAddMemberOpen(true);
  };

  const handleMemberAdded = () => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        
        // Get the current user's organization memberships
        const currentUser = getCurrentUser();
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        
        // First, get the user's organization memberships
        const membershipsResponse = await apiGet(`/organization-members/?user=${currentUser.id}`);
        const memberships = membershipsResponse.data || [];
        
        if (memberships.length === 0) {
          throw new Error('No organization memberships found for the current user');
        }
        
        // Use the first organization membership (or implement logic to select the correct one)
        const organizationId = memberships[0].organization.id;
        
        // Now fetch the members for this organization using the correct endpoint
        const membersResponse = await apiGet(`/organizations/${organizationId}/members/`);
        const data = membersResponse.data || [];
        
            // Transform the API response to match our Member type
        const transformedMembers: Member[] = data.map((member: Omit<Member, 'id'> & { id: string | number }) => ({
            ...member,
            status: member.status as 'active' | 'inactive' | 'suspended',
            lastActive: member.lastActive || new Date().toISOString(),
            joinedAt: member.joinedAt || new Date().toISOString(),
            roleName: getRoleInfo(member.role).name,
            // Add a default avatar based on the first letter of the name
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'U')}&background=random`,
          }));
          
          setMembers(transformedMembers);
        } catch (error) {
          console.error('Error fetching members:', error);
          toast({
            title: 'Error',
            description: 'Failed to load organization members. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchMembers();
    toast({
      title: 'Success',
      description: 'Member added successfully',
    });
  };

  const handleEditMember = async (member: Member) => {
    try {
      const response = await apiPut(`/organization-members/${member.id}/`, member);
      const updatedMember = response.data;
      setMembers(members.map(m => m.id === member.id ? updatedMember : m));
      toast({
        title: 'Success',
        description: 'Member updated successfully',
      });
    } catch (error) {
      console.error('Error editing member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (member: Member) => {
    try {
      const response = await apiDelete(`/organization-members/${member.id}/`);
      if (response.ok) {
        // Remove the member from the local state
        setMembers(members.filter(m => m.id !== member.id));
        toast({
          title: 'Success',
          description: 'Member removed successfully',
        });
      } else {
        throw new Error('Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.avatar ? (
            <img
              src={row.original.avatar}
              alt={row.original.name}
              className="h-8 w-8 rounded-full mr-3"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              {row.original.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="font-medium">{row.original.name || 'Unnamed User'}</p>
            <p className="text-sm text-gray-500">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const roleInfo = getRoleInfo(row.original.role);
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${roleInfo.color}`}>
            {roleInfo.name}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusMap = {
          active: { label: 'Active', color: 'bg-green-100 text-green-800' },
          inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
          suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800' },
        };
        
        const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
        
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'joinedAt',
      header: 'Member Since',
      cell: ({ row }) => {
        if (!row.original.joinedAt) return 'N/A';
        const date = new Date(row.original.joinedAt);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
    {
      accessorKey: 'lastActive',
      header: 'Last Active',
      cell: ({ row }) => {
        if (!row.original.lastActive) return 'N/A';
        const date = new Date(row.original.lastActive);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditMember(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRemoveMember(row.original)}
              className="text-red-600"
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your organization members and their permissions
          </p>
        </div>
        <Button onClick={handleAddMember}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
        
        <AddMemberForm 
          open={isAddMemberOpen} 
          onOpenChange={setIsAddMemberOpen}
          onSuccess={handleMemberAdded}
        />
      </div>

      <div className="rounded-md border">
        <DataTable
          columns={columns}
          data={members}
          searchKey="name"
          className="w-full"
          headerClassName="bg-gray-50"
          rowClassName={({ index }) =>
            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
          }
        />
      </div>
    </div>
  );
}
