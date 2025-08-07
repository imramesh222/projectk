import * as React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTableEmptyProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function DataTableEmpty({
  title = 'No data available',
  description = 'There are no records to display.',
  actionText,
  onAction,
  className = '',
}: DataTableEmptyProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction}>
          <Search className="mr-2 h-4 w-4" />
          {actionText}
        </Button>
      )}
    </div>
  );
}

// Create a version that can be used directly in the table body
export function TableEmpty({
  colSpan,
  title = 'No results found',
  description = 'No data matches your search criteria.',
}: {
  colSpan: number;
  title?: string;
  description?: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center space-y-2">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <p className="font-medium">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
