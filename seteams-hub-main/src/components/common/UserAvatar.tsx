import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from './StatusIndicator';
import { cn } from '@/lib/utils';
import { User } from '@/types/teams';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const statusPositions = {
  sm: '-bottom-0.5 -right-0.5',
  md: '-bottom-0.5 -right-0.5',
  lg: '-bottom-0.5 -right-0.5',
  xl: '-bottom-1 -right-1',
};

const statusSizes: Record<string, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
};

export function UserAvatar({ user, size = 'md', showStatus = false, className }: UserAvatarProps) {
  const initials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <div className={cn('relative', className)}>
      <Avatar className={sizeClasses[size]}>
        {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
        <AvatarFallback className={cn('bg-primary text-primary-foreground', textSizes[size])}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <StatusIndicator
          status={user.status}
          size={statusSizes[size]}
          className={cn('absolute', statusPositions[size])}
        />
      )}
    </div>
  );
}
