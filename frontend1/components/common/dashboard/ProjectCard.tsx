import { Clock, Users, CheckCircle2, AlertCircle, Pause, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

interface ProjectCardProps {
  id: string | number;
  name: string;
  status: ProjectStatus;
  progress: number;
  membersCount: number;
  deadline: string;
  className?: string;
  onClick?: () => void;
}

const statusConfig = {
  planning: {
    icon: Clock,
    color: 'bg-blue-100 text-blue-800',
    label: 'Planning',
  },
  in_progress: {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
    label: 'In Progress',
  },
  on_hold: {
    icon: Pause,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'On Hold',
  },
  completed: {
    icon: CheckCircle2,
    color: 'bg-purple-100 text-purple-800',
    label: 'Completed',
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    label: 'Cancelled',
  },
};

export function ProjectCard({
  id,
  name,
  status,
  progress,
  membersCount,
  deadline,
  className,
  onClick,
}: ProjectCardProps) {
  const statusInfo = statusConfig[status] || statusConfig.planning;
  const StatusIcon = statusInfo.icon;
  
  const isOverdue = new Date(deadline) < new Date() && status !== 'completed' && status !== 'cancelled';
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            statusInfo.color
          )}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusInfo.label}
        </span>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-500">
          <Users className="h-4 w-4 mr-1" />
          <span>{membersCount} {membersCount === 1 ? 'member' : 'members'}</span>
        </div>
        <div className={cn("flex items-center", isOverdue ? 'text-red-600' : 'text-gray-500')}>
          <Clock className="h-4 w-4 mr-1" />
          <span>
            {isOverdue ? 'Overdue: ' : ''}
            {new Date(deadline).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
