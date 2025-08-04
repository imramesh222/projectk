'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, UserPlus, Edit, Trash2, Eye, Check, X, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { User } from '@/types';
import { formatDistanceToNow } from 'date-fns';

type CellProps = {
  row: {
    getValue: (key: string) => any;
    original: User;
  };
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'first_name',
    header: 'First Name',
  },
  {
    accessorKey: 'last_name',
    header: 'Last Name',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }: CellProps) => {
      const role = row.getValue('role') as string;
      return (
        <Badge variant="outline" className="capitalize">
          {role}
        </Badge>
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
    accessorKey: 'organization',
    header: 'Organization',
    cell: ({ row }: CellProps) => {
      const org = row.original.organization_memberships?.[0]?.organization?.name;
      return org || '—';
    },
  },
  {
    accessorKey: 'organization_role',
    header: 'Org Role',
    cell: ({ row }: CellProps) => {
      const role = row.original.organization_memberships?.[0]?.role;
      return role ? (
        <Badge variant="outline" className="capitalize">
          {role}
        </Badge>
      ) : '—';
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
