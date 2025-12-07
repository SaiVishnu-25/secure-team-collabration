import { useState } from 'react';
import { 
  Phone, 
  Video, 
  PhoneIncoming, 
  PhoneMissed, 
  PhoneOutgoing,
  Clock,
  MoreHorizontal,
  Search,
  Voicemail,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/common/UserAvatar';
import { users } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CallRecord {
  id: string;
  type: 'incoming' | 'outgoing' | 'missed';
  callType: 'audio' | 'video';
  participants: typeof users;
  duration?: number;
  timestamp: Date;
}

const callHistory: CallRecord[] = [
  {
    id: '1',
    type: 'incoming',
    callType: 'video',
    participants: [users[1]],
    duration: 1245,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '2',
    type: 'missed',
    callType: 'audio',
    participants: [users[2]],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '3',
    type: 'outgoing',
    callType: 'video',
    participants: [users[3], users[4]],
    duration: 3600,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: '4',
    type: 'incoming',
    callType: 'audio',
    participants: [users[5]],
    duration: 420,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

const speedDial = users.slice(1, 6);

export function CallsView() {
  const [selectedTab, setSelectedTab] = useState('history');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.type === 'missed') return PhoneMissed;
    if (call.type === 'incoming') return PhoneIncoming;
    return PhoneOutgoing;
  };

  return (
    <div className="flex-1 flex bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Calls</h1>
          <Button size="sm" className="gap-2">
            <Phone className="w-4 h-4" />
            Make a call
          </Button>
        </div>

        {/* Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
          <TabsList className="h-10 w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              History
            </TabsTrigger>
            <TabsTrigger value="voicemail" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Voicemail
            </TabsTrigger>
            <TabsTrigger value="speed-dial" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Speed dial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="flex-1 m-0 overflow-auto teams-scrollbar">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search history"
                  className="pl-9 h-9 bg-muted border-none"
                />
              </div>
            </div>

            {/* Call History */}
            <div className="p-4">
              <div className="space-y-1">
                {callHistory.map((call) => {
                  const Icon = getCallIcon(call);
                  const isMissed = call.type === 'missed';

                  return (
                    <div
                      key={call.id}
                      className="flex items-center gap-3 p-3 rounded-md hover:bg-teams-hover transition-colors"
                    >
                      {call.participants.length === 1 ? (
                        <UserAvatar user={call.participants[0]} size="lg" showStatus />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'font-medium',
                            isMissed && 'text-destructive'
                          )}>
                            {call.participants.length === 1
                              ? call.participants[0].name
                              : `Group call (${call.participants.length})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon className={cn('w-3 h-3', isMissed && 'text-destructive')} />
                          <span>
                            {call.callType === 'video' ? 'Video call' : 'Audio call'}
                          </span>
                          {call.duration && (
                            <>
                              <span>•</span>
                              <span>{formatDuration(call.duration)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(call.timestamp, { addSuffix: true })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Video className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="voicemail" className="flex-1 m-0">
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Voicemail className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">No voicemails</h2>
              <p className="text-muted-foreground max-w-sm">
                When you receive voicemails, they'll appear here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="speed-dial" className="flex-1 m-0 p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Add people here to call them quickly
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {speedDial.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-lg border hover:bg-teams-hover transition-colors text-center"
                >
                  <UserAvatar user={user} size="xl" showStatus className="mx-auto mb-3" />
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground mb-3">{user.email}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" className="w-8 h-8">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="w-8 h-8">
                      <Video className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
