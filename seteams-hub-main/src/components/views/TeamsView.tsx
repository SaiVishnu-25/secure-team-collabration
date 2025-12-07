import { useEffect, useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Hash, 
  Lock, 
  Plus, 
  MoreHorizontal, 
  Send, 
  Paperclip, 
  Smile, 
  AtSign,
  Video,
  Phone,
  Users,
  Settings,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/common/UserAvatar';
import { teams, channelMessages, currentUser, users } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Team, Channel, Message } from '@/types/teams';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input as TextInput } from '@/components/ui/input';
import { setUserPublicKey, ensureRoom, subscribeDecryptedMessages, sendEncryptedMessage } from '@/lib/chat';
import { generateKeyPair, keyToBase64, base64ToKey, unseal, decryptFile } from '@/lib/crypto';
import { uploadSecureFile, getFileMetadata, type UploadOptions, type UploadResult } from '@/lib/upload';
import { firebaseAuth } from '@/lib/firebase-config';
import { toast } from 'sonner';
import { useRef } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export function TeamsView() {
  const [teamsState, setTeamsState] = useState<Team[]>(teams);
  const [expandedTeams, setExpandedTeams] = useState<string[]>(teams.map(t => t.id));
  const [selectedChannel, setSelectedChannel] = useState<{ team: Team; channel: Channel } | null>({
    team: teams[0],
    channel: teams[0].channels[0],
  });
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null);
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<string>('posts');
  const [isNewTeamOpen, setIsNewTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const selfId = firebaseAuth.currentUser?.uid || currentUser.id;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(firebaseAuth);
        } catch (e) {
          toast.error('Authentication required to send messages');
        }
      }
    });
    const initKeys = async () => {
      const privBase64 = localStorage.getItem('user_private_key');
      const pubBase64 = localStorage.getItem('user_public_key');
      if (!privBase64 || !pubBase64) {
        const { publicKey, privateKey } = await generateKeyPair();
        localStorage.setItem('user_private_key', keyToBase64(privateKey));
        localStorage.setItem('user_public_key', keyToBase64(publicKey));
        await setUserPublicKey(selfId, publicKey);
        setPublicKey(publicKey);
        setPrivateKey(privateKey);
      } else {
        const pub = base64ToKey(pubBase64);
        const priv = base64ToKey(privBase64);
        await setUserPublicKey(selfId, pub);
        setPublicKey(pub);
        setPrivateKey(priv);
      }
    };
    initKeys();
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!selectedChannel || !publicKey || !privateKey) return;
    const roomId = `${selectedChannel.team.id}:${selectedChannel.channel.id}`;
    const memberIds = Array.from(new Set([selfId, ...users.map(u => u.id)]));
    ensureRoom(roomId, Array.from(new Set(memberIds))).then(() => {
      const unsub = subscribeDecryptedMessages(
        roomId,
        selfId,
        publicKey,
        privateKey,
        (msgs) => {
          const mapped: Message[] = msgs.map(m => ({
            id: m.id,
            senderId: m.senderId,
            senderName:
              m.senderId === selfId
                ? (firebaseAuth.currentUser?.displayName || firebaseAuth.currentUser?.email || currentUser.name)
                : (users.find(u => u.id === m.senderId)?.name || m.senderId),
            content: m.content,
            timestamp: m.timestamp,
          }));
          setMessages(mapped);
        }
      );
      return () => unsub();
    });
  }, [selectedChannel, publicKey, privateKey]);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel || !publicKey || !privateKey) return;
    const roomId = `${selectedChannel.team.id}:${selectedChannel.channel.id}`;
    try {
      await sendEncryptedMessage(roomId, selfId, messageInput, publicKey, privateKey);
      setMessageInput('');
    } catch (e) {
      toast.error('Failed to send message');
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannel || !publicKey) return;
    try {
      const roomId = `${selectedChannel.team.id}:${selectedChannel.channel.id}`;
      const memberIds = Array.from(new Set([selfId, ...users.map(u => u.id)]));
      const options: UploadOptions = {
        safeBrowsingProxyUrl: import.meta.env.VITE_SAFE_BROWSING_PROXY_URL || undefined,
        urlScanApiKey: import.meta.env.VITE_URLSCAN_API_KEY || undefined,
        useClamAV: false,
        stripExif: true,
        reencodeImages: false,
        imageMaxSizeMB: 4,
        concurrency: 4,
        recipientPublicKey: publicKey,
        recipientUserIds: memberIds,
        roomId,
        uploadedBy: firebaseAuth.currentUser?.uid || currentUser.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        onProgress: () => {},
        storageProvider: 'supabase',
        supabaseBucket: 'encrypted',
        signedUrlExpirySeconds: 3600,
      };
      const result: UploadResult = await uploadSecureFile(file, options);
      const attachment = {
        id: result.fileId,
        name: file.name,
        type: 'file' as const,
        url: result.downloadUrl,
        size: file.size,
      };
      if (privateKey) {
        await sendEncryptedMessage(roomId, selfId, `Shared a file: ${file.name}`, publicKey, privateKey, [attachment]);
      }
      toast.success('File uploaded and shared');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  type StoredFileMeta = {
    sealedKey?: string;
    sealedKeys?: Record<string, string> | null;
    headerUrl?: string;
    headerBase64?: string | null;
    chunkUrls: string[];
    mimeType?: string;
    originalName?: string;
  };

  const handleDownloadAttachment = async (attachment: { id: string; name: string }) => {
    if (!privateKey || !publicKey) return;
    const meta = await getFileMetadata(attachment.id) as StoredFileMeta;
    const sealed = (meta.sealedKeys && meta.sealedKeys[currentUser.id]) ? meta.sealedKeys[currentUser.id] : meta.sealedKey!;
    const encryptionKey = await unseal(base64ToKey(sealed), privateKey, publicKey);
    const header: Uint8Array = meta.headerBase64 ? base64ToKey(meta.headerBase64) : new Uint8Array(await (await fetch(meta.headerUrl!)).arrayBuffer());
    const chunks: Uint8Array[] = [];
    for (const url of meta.chunkUrls) {
      const res = await fetch(url);
      const buf = new Uint8Array(await res.arrayBuffer());
      chunks.push(buf);
    }
    const decrypted = await decryptFile(header, chunks, encryptionKey);
    const blob = new Blob([decrypted], { type: meta.mimeType || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = meta.originalName || attachment.name;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  };

  return (
    <div className="flex-1 flex bg-background">
      {/* Teams List */}
      <div className="w-72 border-r flex flex-col">
        {/* Header */}
        <div className="h-12 border-b flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Teams</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsNewTeamOpen(true)}>
              <Plus className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Teams</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsNewTeamOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsManageMembersOpen(true)} className="gap-2">
                  <Users className="w-4 h-4" />
                  Manage members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('files')} className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Open files
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Settings opened')} className="gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Teams List */}
        <div className="flex-1 overflow-auto teams-scrollbar p-2">
          {teamsState.map((team) => (
            <div key={team.id} className="mb-1">
              {/* Team Header */}
              <button
                onClick={() => toggleTeam(team.id)}
                className="w-full p-2 rounded-md flex items-center gap-2 hover:bg-teams-hover transition-colors"
              >
                {expandedTeams.includes(team.id) ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-foreground">
                    {team.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <span className="font-medium text-sm">{team.name}</span>
              </button>

              {/* Channels */}
              {expandedTeams.includes(team.id) && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {team.channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel({ team, channel })}
                      className={cn(
                        'w-full p-2 rounded-md flex items-center gap-2 text-left transition-colors',
                        selectedChannel?.channel.id === channel.id
                          ? 'bg-teams-active'
                          : 'hover:bg-teams-hover'
                      )}
                    >
                      {channel.isPrivate ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Hash className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm flex-1 truncate">{channel.name}</span>
                      {channel.unreadCount && channel.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {channel.unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Channel Content */}
      {selectedChannel ? (
        <div className="flex-1 flex flex-col">
          {/* Channel Header */}
          <div className="h-12 border-b flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              {selectedChannel.channel.isPrivate ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Hash className="w-4 h-4 text-muted-foreground" />
              )}
              <h2 className="font-semibold">{selectedChannel.channel.name}</h2>
              <span className="text-sm text-muted-foreground">
                {selectedChannel.channel.memberCount} members
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Users className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="h-10 w-full justify-start rounded-none border-b bg-transparent px-4">
              <TabsTrigger value="posts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Posts
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Files
              </TabsTrigger>
              <TabsTrigger value="wiki" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Wiki
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="flex-1 flex flex-col m-0">
              {/* Messages */}
              <div className="flex-1 overflow-auto teams-scrollbar p-4 space-y-4">
                {messages.map((message, index) => {
                  const isOwn = message.senderId === currentUser.id;
                  const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                  const user = isOwn ? currentUser : users.find(u => u.id === message.senderId) || users[0];

                  return (
                    <div key={message.id} className="flex gap-3 group">
                      {showAvatar ? (
                        <UserAvatar user={user} size="md" />
                      ) : (
                        <div className="w-8" />
                      )}
                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{message.senderName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <button
                                key={attachment.id}
                                onClick={() => handleDownloadAttachment({ id: attachment.id, name: attachment.name })}
                                className="flex items-center gap-2 p-2 rounded border bg-muted/50 max-w-xs hover:bg-muted"
                              >
                                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm truncate">{attachment.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {message.reactions.map((reaction, i) => (
                              <button
                                key={i}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-sm"
                              >
                                <span>{reaction.emoji}</span>
                                <span className="text-xs text-muted-foreground">{reaction.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" onClick={handleAttachClick}>
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder={`Message ${selectedChannel.channel.name}`}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="pr-20"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground"
                      >
                        <AtSign className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    className="w-8 h-8"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="flex-1 p-4">
              <div className="text-center text-muted-foreground py-12">
                No files shared in this channel yet
              </div>
            </TabsContent>

            <TabsContent value="wiki" className="flex-1 p-4">
              <div className="text-center text-muted-foreground py-12">
                No wiki pages created yet
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a channel to start collaborating
        </div>
      )}

      <Dialog open={isNewTeamOpen} onOpenChange={setIsNewTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <TextInput
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!newTeamName.trim()) return;
                const id = `team-${Date.now()}`;
                const newTeam: Team = {
                  id,
                  name: newTeamName.trim(),
                  memberCount: 1,
                  channels: [
                    { id: `channel-${Date.now()}`, name: 'general', isPrivate: false, memberCount: 1 },
                  ],
                } as Team;
                setTeamsState((prev) => [newTeam, ...prev]);
                setExpandedTeams((prev) => [...prev, id]);
                setSelectedChannel({ team: newTeam, channel: newTeam.channels[0] });
                setNewTeamName('');
                setIsNewTeamOpen(false);
                toast.success('Team created');
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">{selectedChannel?.team.name}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedChannel) return;
                  const id = selectedChannel.team.id;
                  setTeamsState((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, memberCount: t.memberCount + 1 } : t))
                  );
                  setSelectedChannel(({ team, channel }) =>
                    team && channel
                      ? {
                          team: { ...team, memberCount: team.memberCount + 1 },
                          channel: { ...channel, memberCount: channel.memberCount + 1 },
                        }
                      : null
                  );
                }}
              >
                Add member
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedChannel) return;
                  const id = selectedChannel.team.id;
                  setTeamsState((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, memberCount: Math.max(0, t.memberCount - 1) } : t))
                  );
                  setSelectedChannel(({ team, channel }) =>
                    team && channel
                      ? {
                          team: { ...team, memberCount: Math.max(0, team.memberCount - 1) },
                          channel: { ...channel, memberCount: Math.max(0, channel.memberCount - 1) },
                        }
                      : null
                  );
                }}
              >
                Remove member
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsManageMembersOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
