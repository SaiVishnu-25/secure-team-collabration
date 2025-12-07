import { 
  Puzzle,
  Calendar,
  CheckSquare,
  FileText,
  BarChart3,
  Trello,
  Github,
  Figma,
  Slack,
  Zap,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface App {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  isInstalled?: boolean;
}

const apps: App[] = [
  {
    id: '1',
    name: 'Planner',
    description: 'Create plans, organize tasks, and track progress',
    icon: CheckSquare,
    category: 'Productivity',
    isInstalled: true,
  },
  {
    id: '2',
    name: 'OneNote',
    description: 'Create and share notes, ideas, and to-do lists',
    icon: FileText,
    category: 'Productivity',
    isInstalled: true,
  },
  {
    id: '3',
    name: 'Power BI',
    description: 'Visualize your data and share insights',
    icon: BarChart3,
    category: 'Analytics',
    isInstalled: true,
  },
  {
    id: '4',
    name: 'Trello',
    description: 'Organize and prioritize projects in a fun way',
    icon: Trello,
    category: 'Project Management',
  },
  {
    id: '5',
    name: 'GitHub',
    description: 'Keep track of pull requests, issues, and more',
    icon: Github,
    category: 'Developer Tools',
  },
  {
    id: '6',
    name: 'Figma',
    description: 'Collaborate on designs in real-time',
    icon: Figma,
    category: 'Design',
  },
  {
    id: '7',
    name: 'Slack',
    description: 'Connect with your Slack workspace',
    icon: Slack,
    category: 'Communication',
  },
  {
    id: '8',
    name: 'Zapier',
    description: 'Automate workflows between apps',
    icon: Zap,
    category: 'Automation',
  },
];

export function AppsView() {
  const installedApps = apps.filter(app => app.isInstalled);
  const availableApps = apps.filter(app => !app.isInstalled);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-12 border-b flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold">Apps</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto teams-scrollbar">
        <div className="max-w-4xl mx-auto p-6">
          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for apps"
              className="pl-12 h-12 text-lg bg-muted border-none"
            />
          </div>

          {/* Installed Apps */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">
              INSTALLED APPS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {installedApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </div>

          {/* Available Apps */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">
              AVAILABLE APPS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppCard({ app }: { app: App }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-teams-hover transition-colors">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <app.icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{app.name}</h3>
          {app.isInstalled && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded">Installed</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {app.description}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {app.category}
        </p>
      </div>
      <Button variant={app.isInstalled ? "outline" : "default"} size="sm">
        {app.isInstalled ? 'Open' : 'Add'}
      </Button>
    </div>
  );
}
