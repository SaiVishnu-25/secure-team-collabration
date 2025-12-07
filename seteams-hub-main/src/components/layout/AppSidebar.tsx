import { 
  Activity, 
  MessageSquare, 
  Users, 
  Calendar, 
  Phone, 
  FolderOpen,
  MoreHorizontal,
  Settings,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'activity', icon: Activity, label: 'Activity' },
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'teams', icon: Users, label: 'Teams' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'calls', icon: Phone, label: 'Calls' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
];

const bottomItems = [
  { id: 'apps', icon: MoreHorizontal, label: 'More apps' },
];

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  return (
    <aside className="w-16 bg-sidebar flex flex-col items-center py-3 border-r border-sidebar-border">
      {/* Top Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => (
          <Tooltip key={item.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-12 h-12 rounded-md flex items-center justify-center transition-all duration-200',
                  activeView === item.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-background text-xs">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="flex flex-col items-center gap-1 pt-2 border-t border-sidebar-border">
        {bottomItems.map((item) => (
          <Tooltip key={item.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-12 h-12 rounded-md flex items-center justify-center transition-all duration-200',
                  activeView === item.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-background text-xs">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </aside>
  );
}
