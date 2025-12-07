import { AtSign, MessageSquare, Heart, Calendar, FileText, MoreHorizontal, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { activities } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const activityIcons = {
  mention: AtSign,
  reply: MessageSquare,
  reaction: Heart,
  meeting: Calendar,
  file: FileText,
};

export function ActivityView() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-12 border-b flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold">Activity</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-auto teams-scrollbar">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Recent</h2>
          <div className="space-y-1">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <button
                  key={activity.id}
                  className={cn(
                    'w-full p-3 rounded-md flex items-start gap-3 text-left transition-colors',
                    activity.isRead
                      ? 'hover:bg-teams-hover'
                      : 'bg-teams-active hover:bg-primary/10'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    activity.isRead ? 'bg-muted' : 'bg-primary/20'
                  )}>
                    <Icon className={cn(
                      'w-4 h-4',
                      activity.isRead ? 'text-muted-foreground' : 'text-primary'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm truncate',
                        !activity.isRead && 'font-semibold'
                      )}>
                        {activity.title}
                      </span>
                      {!activity.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
