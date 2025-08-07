import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableLoadingProps {
  /** Number of rows to show in the skeleton loader */
  rowCount?: number;
  /** Number of columns to show in the skeleton loader */
  columnCount?: number;
  /** Whether to show the header row */
  showHeader?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Height of each row in pixels */
  rowHeight?: number;
}

export function DataTableLoading({
  rowCount = 5,
  columnCount = 5,
  showHeader = true,
  className = '',
  rowHeight = 48,
}: DataTableLoadingProps) {
  // Create array for rows
  const rows = Array.from({ length: rowCount }, (_, i) => i);
  // Create array for columns
  const columns = Array.from({ length: columnCount }, (_, i) => i);

  return (
    <div className={className}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={`header-${col}`}>
                  <Skeleton className="h-4 w-3/4" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`row-${row}`} style={{ height: `${rowHeight}px` }}>
              {columns.map((col) => (
                <TableCell key={`cell-${row}-${col}`}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Create a version that can be used directly in the table body
export function TableLoading({
  colCount,
  rowCount = 3,
  className = '',
}: {
  colCount: number;
  rowCount?: number;
  className?: string;
}) {
  const rows = Array.from({ length: rowCount }, (_, i) => i);
  const cols = Array.from({ length: colCount }, (_, i) => i);

  return (
    <>
      {rows.map((row) => (
        <TableRow key={`loading-row-${row}`} className={className}>
          {cols.map((col) => (
            <TableCell key={`loading-cell-${row}-${col}`}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
