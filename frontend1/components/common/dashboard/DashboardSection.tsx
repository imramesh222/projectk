import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', contentClassName)}>
        {children}
      </div>
    </section>
  );
}
