import { 
  Row, 
  Table as TableType,
  HeaderContext,
  RowData,
  ColumnDefBase,
  ColumnDef,
  CellContext
} from '@tanstack/react-table';

// Extend the ColumnMeta type to include our custom properties
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    description?: string;
    cellClassName?: string | ((data: TData) => string);
    headerClassName?: string;
  }
}

/**
 * Type for data table column definition
 * Extends the base ColumnDef from @tanstack/react-table with additional metadata for UI
 */
export type DataTableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue> & {
  /**
   * The header string or a function that returns a React node
   */
  header: string | ((props: HeaderContext<TData, TValue>) => React.ReactNode);
  
  /**
   * Optional description for the column
   */
  description?: string;
  
  /**
   * Whether the column can be hidden
   */
  enableHiding?: boolean;
  
  /**
   * Whether the column can be sorted
   */
  enableSorting?: boolean;
  
  /**
   * Custom class name for the cell
   */
  cellClassName?: string | ((data: TData) => string);
  
  /**
   * Custom class name for the header
   */
  headerClassName?: string;
  
  /**
   * Custom cell renderer
   */
  cell?: (context: CellContext<TData, TValue>) => React.ReactNode;
  
  /**
   * Accessor key or function to extract the value for this column
   */
  accessorKey?: string & keyof TData;
  
  /**
   * Unique ID for the column
   */
  id?: string;
};

/**
 * Type for data table props
 */
export interface DataTableProps<TData, TValue> {
  columns: DataTableColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  error?: Error | null;
  onRowClick?: (row: Row<TData>) => void;
  className?: string;
  // Pagination
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  // Sorting
  onSortingChange?: (sorting: { id: string; desc: boolean }[]) => void;
  // Selection
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  // Custom renderers
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  errorState?: React.ReactNode;
  // Custom components
  toolbar?: (table: TableType<TData>) => React.ReactNode;
  footer?: (table: TableType<TData>) => React.ReactNode;
}
