import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'suspended' 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info'
  | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  // Determine variant based on status if not explicitly provided
  const getVariant = (): StatusVariant => {
    if (variant) return variant;
    
    const statusLower = status.toLowerCase();
    
    if (['active', 'enabled', 'success', 'completed', 'verified'].includes(statusLower)) {
      return 'success';
    } 
    if (['inactive', 'disabled', 'paused'].includes(statusLower)) {
      return 'inactive';
    }
    if (['pending', 'waiting', 'processing'].includes(statusLower)) {
      return 'pending';
    }
    if (['suspended', 'banned', 'rejected', 'failed', 'error'].includes(statusLower)) {
      return 'error';
    }
    if (['warning', 'attention', 'expiring'].includes(statusLower)) {
      return 'warning';
    }
    return 'default';
  };

  const variantClasses = {
    active: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    suspended: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    success: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    error: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <Badge 
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[getVariant()],
        className
      )}
    >
      {status}
    </Badge>
  );
}
