'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  Clock, 
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Building2
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { User, UserWithDetails } from '@/types';
import { formatDistanceToNow } from 'date-fns';

type CellProps = {
  row: {
    getValue: (key: string) => any;
    original: UserWithDetails;
    toggleExpanded: (expanded?: boolean) => void;
    getIsExpanded: () => boolean;
  };
  value?: any;
};

// Helper to get role badge color
const getRoleBadgeVariant = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'default';
    case 'manager':
      return 'secondary';
    case 'member':
      return 'outline';
    default:
      return 'outline';
  }
};

import { OrganizationMembership, OrganizationRole } from '@/types';

// Type for organization membership that can handle both string and OrganizationRole types
type MembershipWithRoles = Omit<OrganizationMembership, 'roles'> & {
  roles: (string | OrganizationRole)[];
  organization: {
    id: string;
    name: string;
    is_active: boolean;
  };
};

export const columns: ColumnDef<UserWithDetails>[] = [
  {
    accessorKey: 'first_name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent font-semibold text-gray-700 dark:text-gray-200"
        >
          Name
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium pl-4">
        {row.original.first_name || '—'}
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent font-semibold text-gray-700 dark:text-gray-200"
        >
          Email
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {row.original.email}
      </div>
    ),
  },
  {
    accessorKey: 'is_active',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent font-semibold text-gray-700 dark:text-gray-200"
        >
          Status
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <div className="flex items-center">
          <span className={`h-2.5 w-2.5 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
          <span className="text-sm">{isActive ? 'Active' : 'Inactive'}</span>
        </div>
      );
    },
  },
  {
    id: 'organizations',
    header: ({ column }) => (
      <div className="font-semibold text-gray-700 dark:text-gray-200">
        Organizations
      </div>
    ),
    cell: ({ row }) => {
      const memberships = row.original.organization_memberships || [];
      const [selectedOrgId, setSelectedOrgId] = useState(memberships[0]?.organization?.id || '');
      
      const selectedMembership = memberships.find(m => m.organization?.id === selectedOrgId) || memberships[0];
      
      if (memberships.length === 0) {
        return <div className="text-sm text-gray-500">No organizations</div>;
      }
      
      if (memberships.length === 1) {
        return (
          <div className="font-medium">
            {selectedMembership.organization?.name || '—'}
          </div>
        );
      }
      
      return (
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="bg-transparent border-none focus:ring-0 p-0 text-sm font-medium cursor-pointer"
        >
          {memberships.map((membership) => (
            <option 
              key={membership.organization?.id} 
              value={membership.organization?.id}
            >
              {membership.organization?.name}
            </option>
          ))}
        </select>
      );
    },
  },
  {
    id: 'roles',
    header: ({ column }) => (
      <div className="font-semibold text-gray-700 dark:text-gray-200">
        Roles
      </div>
    ),
    cell: ({ row }) => {
      const memberships = row.original.organization_memberships || [];
      const [selectedOrgId, setSelectedOrgId] = useState(memberships[0]?.organization?.id || '');
      
      const selectedMembership = memberships.find(m => m.organization?.id === selectedOrgId) || memberships[0];
      const roles = selectedMembership?.roles || [];
      
      if (!selectedMembership) {
        return <div className="text-sm text-gray-500">No role</div>;
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role, index) => {
            const roleStr = typeof role === 'string' ? role : role.name;
            return (
              <span 
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
              >
                {roleStr}
              </span>
            );
          })}
        </div>
      );
    },
  },
  {
    id: 'member_since',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent font-semibold text-gray-700 dark:text-gray-200"
        >
          Member Since
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const memberships = row.original.organization_memberships || [];
      const [selectedOrgId] = useState(memberships[0]?.organization?.id || '');
      
      const selectedMembership = memberships.find(m => m.organization?.id === selectedOrgId) || memberships[0];
      const joinedAt = selectedMembership?.joined_at;
      
      if (!joinedAt) {
        return <div className="text-sm text-gray-500">—</div>;
      }
      
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(joinedAt).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }: CellProps) => {
      const isActive = row.getValue('is_active') as boolean;
      return (
        <Badge variant={isActive ? 'default' : 'secondary'} className="capitalize">
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'last_login',
    header: 'Last Login',
    cell: ({ row }: CellProps) => {
      const lastLogin = row.getValue('last_login');
      if (!lastLogin) return 'Never';
      
      const date = new Date(lastLogin as string);
      return formatDistanceToNow(date, { addSuffix: true });
    },
  },
  {
    accessorKey: 'organizations',
    header: 'Organizations & Roles',
    cell: ({ row }: CellProps) => {
      const memberships: MembershipWithRoles[] = row.original.organization_memberships || [];
      const isExpanded = row.getIsExpanded();
      
      if (!memberships.length) {
        return <span className="text-muted-foreground">No organizations</span>;
      }

      return (
        <div className="space-y-2">
          <div 
            className="flex items-center text-sm font-medium cursor-pointer hover:text-primary"
            onClick={() => row.toggleExpanded()}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            {memberships.length} organization{memberships.length !== 1 ? 's' : ''}
          </div>
          
          {isExpanded && (
            <div className="pl-5 space-y-2">
              {memberships.map((membership: MembershipWithRoles) => (
                <div key={membership.id} className="border-l-2 pl-3 py-1">
                  <div className="flex items-center font-medium">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    {membership.organization.name}
                    {!membership.organization.is_active && (
                      <Badge variant="outline" className="ml-2 text-xs">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {membership.roles.map((role, i) => {
                      const roleName = typeof role === 'string' ? role : role.name;
                      return (
                        <Badge key={i} variant={getRoleBadgeVariant(roleName)}>
                          {roleName}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Joined {new Date(membership.joined_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'date_joined',
    header: 'Member Since',
    cell: ({ row }: CellProps) => {
      const date = new Date(row.getValue('date_joined'));
      return date.toLocaleDateString();
    },
  },
  {
    id: 'actions',
    cell: ({ row }: CellProps) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit user</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
