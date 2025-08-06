import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTableViewOptions } from '../DataTableViewOptions';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchColumn?: string;
  onSearch?: (value: string) => void;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Search...',
  searchColumn,
  onSearch,
  actions,
  filters,
  className = '',
}: DataTableToolbarProps<TData>) {
  const [searchValue, setSearchValue] = React.useState('');
  const hasSearch = !!searchColumn || !!onSearch;
  const hasFilters = React.useMemo(
    () => table.getHeaderGroups().some(group => 
      group.headers.some(header => header.column.getCanFilter())
    ),
    [table]
  );

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    
    if (searchColumn) {
      table.getColumn(searchColumn)?.setFilterValue(value);
    }
    
    if (onSearch) {
      onSearch(value);
    }
  };

  // Show toolbar only if there are any interactive elements
  if (!hasSearch && !hasFilters && !actions) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between py-4 ${className}`}>
      <div className="flex flex-1 items-center space-x-2">
        {hasSearch && (
          <div className="relative flex-1 md:flex-initial md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              className="pl-8 h-9 w-full"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
        )}
        
        {filters && (
          <div className="flex items-center space-x-2">
            {filters}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {hasFilters && (
          <DataTableViewOptions table={table} />
        )}
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
