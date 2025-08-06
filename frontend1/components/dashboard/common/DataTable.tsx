'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Table as TableType,
  Row,
  ColumnResizeMode,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableEmpty } from './DataTableEmpty';
import { DataTableLoading } from './DataTableLoading';
import { DataTableError } from './DataTableError';

import { DataTableProps } from './data-table.types';

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  error = null,
  onRowClick,
  className,
  // Pagination
  pageCount = -1,
  pageIndex: controlledPageIndex = 0,
  pageSize: controlledPageSize = 10,
  onPaginationChange,
  // Sorting
  onSortingChange,
  // Selection
  enableRowSelection = false,
  onRowSelectionChange,
  // Custom renderers
  emptyState,
  loadingState,
  errorState,
  // Custom components
  toolbar,
  footer,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnResizeMode] = React.useState<ColumnResizeMode>('onChange');

  // Handle server-side pagination
  const pagination = React.useMemo(
    () => ({
      pageIndex: controlledPageIndex,
      pageSize: controlledPageSize,
    }),
    [controlledPageIndex, controlledPageSize]
  );

  // Initialize the table
  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount >= 0 ? pageCount : undefined,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: pageCount >= 0 ? pagination : undefined,
    },
    enableRowSelection: enableRowSelection,
    manualPagination: pageCount >= 0,
    manualSorting: !!onSortingChange,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    onPaginationChange: (updater) => {
      if (onPaginationChange) {
        const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
        onPaginationChange(newPagination.pageIndex, newPagination.pageSize);
      }
    },
    onRowSelectionChange: (updater) => {
      const newRowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newRowSelection);
      
      if (onRowSelectionChange) {
        const selectedRows = table.getSelectedRowModel().flatRows.map(row => row.original);
        onRowSelectionChange(selectedRows);
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Handle row click
  const handleRowClick = (row: Row<TData>) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  // Show loading state
  if (isLoading) {
    return loadingState || <DataTableLoading />;
  }

  // Show error state
  if (error) {
    return errorState || <DataTableError error={error} />;
  }

  // Show empty state
  if (!data.length) {
    return emptyState || <DataTableEmpty />;
  }

  return (
    <div className={className}>
      {/* Toolbar */}
      {toolbar ? (
        toolbar(table)
      ) : (
        <DataTableToolbar table={table} />
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    colSpan={header.colSpan}
                    className={header.column.columnDef.headerClassName as string}
                    style={{
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => handleRowClick(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className={cell.column.columnDef.cellClassName as string}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Footer */}
      {footer && footer(table)}
    </div>
  );
}
