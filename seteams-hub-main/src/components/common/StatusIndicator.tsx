import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'away' | 'busy' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

const statusColors = {
  online: 'bg-teams-online',
  away: 'bg-teams-away',
  busy: 'bg-teams-busy',
  offline: 'bg-muted-foreground',
};

export function StatusIndicator({ status, size = 'md', className }: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        'rounded-full border-2 border-background',
        sizeClasses[size],
        statusColors[status],
        className
      )}
    />
  );
}
