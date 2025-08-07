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

import { Organization, OrganizationMembership, OrganizationRole } from '@/types';

// Type guard to check if organization is an object
const isOrganizationObject = (org: any): org is Organization => {
  return org && typeof org === 'object' && 'id' in org && 'name' in org;
};

// Type guard to check if role is an OrganizationRole object
const isOrganizationRole = (role: any): role is OrganizationRole => {
  return role && typeof role === 'object' && 'id' in role && 'name' in role;
};

// Helper to get organization name safely
const getOrganizationName = (org: Organization | string): string => {
  return isOrganizationObject(org) ? org.name : org;
};

// Helper to get organization ID safely
const getOrganizationId = (org: Organization | string): string => {
  return isOrganizationObject(org) ? org.id : org;
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
      const [selectedOrgId, setSelectedOrgId] = useState(
        memberships[0] ? getOrganizationId(memberships[0].organization) : ''
      );
      
      const selectedMembership = memberships.find(m => 
        getOrganizationId(m.organization) === selectedOrgId
      ) || memberships[0];
      
      if (memberships.length === 0) {
        return <div className="text-sm text-gray-500">No organizations</div>;
      }
      
      if (memberships.length === 1) {
        return (
          <div className="font-medium">
            {selectedMembership ? getOrganizationName(selectedMembership.organization) : '—'}
          </div>
        );
      }
      
      return (
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="bg-transparent border-none focus:ring-0 p-0 text-sm font-medium cursor-pointer"
        >
          {memberships.map((membership) => {
            const orgId = getOrganizationId(membership.organization);
            const orgName = getOrganizationName(membership.organization);
            return (
              <option key={orgId} value={orgId}>
                {orgName}
              </option>
            );
          })}
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
      const [selectedOrgId, setSelectedOrgId] = useState(
        memberships[0] ? getOrganizationId(memberships[0].organization) : ''
      );
      
      const selectedMembership = memberships.find(m => 
        getOrganizationId(m.organization) === selectedOrgId
      ) || memberships[0];
      
      if (!selectedMembership) {
        return <div className="text-sm text-gray-500">No role</div>;
      }
      
      // Handle different role formats (string, string[], or OrganizationRole[])
      const roles = Array.isArray(selectedMembership.roles) 
        ? selectedMembership.roles 
        : typeof selectedMembership.roles === 'string' 
          ? [selectedMembership.roles]
          : [];
      
      if (roles.length === 0) {
        return <div className="text-sm text-gray-500">No roles</div>;
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role, index) => {
            const roleName = isOrganizationRole(role) ? role.name : role;
            return (
              <span 
                key={`${selectedMembership.id}-${index}`}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
              >
                {roleName}
              </span>
            );
          })}
        </div>
      );
    },
  },
  {
    accessorKey: 'last_login',
    header: 'Last Login',
    cell: ({ row }: CellProps) => {
      const lastLogin = row.getValue('last_login');
      return lastLogin ? formatDistanceToNow(new Date(lastLogin), { addSuffix: true }) : 'Never';
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
