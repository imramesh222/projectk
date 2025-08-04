'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Organization } from '@/types';

type CellProps = {
  row: {
    getValue: (key: string) => any;
    original: Organization;
  };
};

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }: CellProps) => (
      <div className="capitalize">
        {row.getValue('is_active') ? 'Active' : 'Inactive'}
      </div>
    ),
  },
  {
    accessorKey: 'member_count',
    header: 'Members',
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ row }: CellProps) => {
      const date = new Date(row.getValue('created_at'));
      return date.toLocaleDateString();
    },
  },
  {
    id: 'actions',
    cell: ({ row }: CellProps) => {
      const organization = row.original;

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
              onClick={() => navigator.clipboard.writeText(organization.id)}
            >
              Copy organization ID
            </DropdownMenuItem>
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit organization</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
