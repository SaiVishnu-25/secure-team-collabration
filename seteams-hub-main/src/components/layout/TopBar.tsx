import { Search, Settings, Bell, ChevronDown, Maximize2, Minus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { firebaseAuth } from '@/lib/firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { currentUser } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusColors = {
  online: 'bg-teams-online',
  away: 'bg-teams-away',
  busy: 'bg-teams-busy',
  offline: 'bg-muted-foreground',
};

export function TopBar() {
  const [authUser, setAuthUser] = useState(firebaseAuth.currentUser);
  const initials = (authUser?.displayName || authUser?.email || currentUser.name)
    .split(' ')
    .map(n => n[0])
    .join('');
  const [settingsOpen, setSettingsOpen] = useState(false as boolean);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem('pref_notifications');
    return v ? v === '1' : true;
  });
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    const v = localStorage.getItem('pref_compact');
    return v ? v === '1' : false;
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setAuthUser(u || null));
    return () => unsub();
  }, []);

  return (
    <>
    <header className="h-12 bg-sidebar flex items-center justify-between px-4 select-none">
      {/* Left section - App title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">ST</span>
          </div>
          <span className="text-sidebar-foreground font-semibold text-sm">SeTeams</span>
        </div>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/50" />
          <Input
            placeholder="Search"
            className="w-full h-8 pl-9 bg-sidebar-accent border-none text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus-visible:ring-1 focus-visible:ring-sidebar-ring"
          />
        </div>
      </div>

      {/* Right section - Actions & Profile */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="w-8 h-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-2 gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
              <div className="relative">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar',
                  statusColors[currentUser.status]
                )} />
              </div>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="p-3 flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                  statusColors[currentUser.status]
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{authUser?.displayName || currentUser.name}</p>
                <p className="text-sm text-muted-foreground truncate">{authUser?.email || currentUser.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <span className={cn('w-2 h-2 rounded-full', statusColors.online)} />
              Available
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <span className={cn('w-2 h-2 rounded-full', statusColors.busy)} />
              Busy
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <span className={cn('w-2 h-2 rounded-full', statusColors.away)} />
              Away
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <span className={cn('w-2 h-2 rounded-full', statusColors.offline)} />
              Appear offline
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Set status message</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => signOut(firebaseAuth)}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable notifications</p>
              <p className="text-xs text-muted-foreground">Show alerts for new messages</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={(checked) => {
                setNotificationsEnabled(!!checked);
                localStorage.setItem('pref_notifications', checked ? '1' : '0');
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Compact mode</p>
              <p className="text-xs text-muted-foreground">Reduce paddings and spacing</p>
            </div>
            <Switch
              checked={compactMode}
              onCheckedChange={(checked) => {
                setCompactMode(!!checked);
                localStorage.setItem('pref_compact', checked ? '1' : '0');
                document.body.classList.toggle('compact', !!checked);
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
