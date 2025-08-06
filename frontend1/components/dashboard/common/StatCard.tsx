import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-semibold">{value}</p>
        <div className="mt-2 flex items-center text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn('mr-1 flex items-center', {
                'text-green-600 dark:text-green-400': trend.type === 'up',
                'text-red-600 dark:text-red-400': trend.type === 'down',
                'text-amber-600 dark:text-amber-400': trend.type === 'neutral',
              })}
            >
              {trend.type === 'up' && <ArrowUp className="h-3 w-3" />}
              {trend.type === 'down' && <ArrowDown className="h-3 w-3" />}
              {trend.type === 'neutral' && <Minus className="h-3 w-3" />}
              <span className="ml-0.5">{trend.value}</span>
            </span>
          )}
          <span>{description}</span>
        </div>
      </div>
    </div>
  );
}
