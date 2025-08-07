import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui';

interface DataTableErrorProps {
  /** The error object or error message */
  error: Error | string | null;
  /** Optional title to display */
  title?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Additional class name */
  className?: string;
}

export function DataTableError({
  error,
  title = 'Something went wrong',
  onRetry,
  className = '',
}: DataTableErrorProps) {
  // Get error message from error object or use as is
  const errorMessage = React.useMemo(() => {
    if (!error) return 'An unknown error occurred';
    if (typeof error === 'string') return error;
    return error.message || 'An unknown error occurred';
  }, [error]);

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Alert className="w-full max-w-md">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="ml-3">
            <AlertTitle className="font-medium">{title}</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              {errorMessage}
            </AlertDescription>
            {onRetry && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="flex items-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
              </div>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}

// Create a version that can be used directly in the table body
export function TableError({
  colSpan,
  error,
  onRetry,
}: {
  colSpan: number;
  error: Error | string | null;
  onRetry?: () => void;
}) {
  const errorMessage = React.useMemo(() => {
    if (!error) return 'An unknown error occurred';
    if (typeof error === 'string') return error;
    return error.message || 'An unknown error occurred';
  }, [error]);

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-48 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="space-y-1 text-center">
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
