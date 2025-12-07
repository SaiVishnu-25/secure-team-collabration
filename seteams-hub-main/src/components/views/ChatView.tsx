import { useEffect, useState } from 'react';
import { Search, Edit, Pin, MoreHorizontal, Send, Paperclip, Smile, Video, Phone, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/common/UserAvatar';
import { chats, users, currentUser } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Chat, Message } from '@/types/teams';
import { setUserPublicKey, ensureRoom, subscribeDecryptedMessages, sendEncryptedMessage } from '@/lib/chat';
import { generateKeyPair, keyToBase64, base64ToKey, unseal, decryptFile } from '@/lib/crypto';
import { uploadSecureFile, getFileMetadata, type UploadOptions, type UploadResult } from '@/lib/upload';
import { firebaseAuth } from '@/lib/firebase-config';
import { toast } from 'sonner';
import { useRef } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export function ChatView() {
  const [chatsState, setChatsState] = useState<Chat[]>(chats);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(chats[0]);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [publicKey, setPublicKey] = useState<Uint8Array | null>(null);
  const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selfId = firebaseAuth.currentUser?.uid || currentUser.id;
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatUserId, setNewChatUserId] = useState<string>('');
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [groupUserIds, setGroupUserIds] = useState<string[]>([]);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice'>('video');
  const [callLink, setCallLink] = useState<string>('');

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
    if (!selectedChat || !publicKey || !privateKey) return;
    const memberIds = [selfId, ...selectedChat.participants.map(p => p.id)];
    ensureRoom(selectedChat.id, Array.from(new Set(memberIds))).then(() => {
      const unsub = subscribeDecryptedMessages(
        selectedChat.id,
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
  }, [selectedChat, publicKey, privateKey]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || !publicKey || !privateKey) return;
    try {
      await sendEncryptedMessage(selectedChat.id, selfId, messageInput, publicKey, privateKey);
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
    if (!file || !selectedChat || !publicKey) return;
    try {
      const memberIds = Array.from(new Set([selfId, ...selectedChat.participants.map(p => p.id)]));
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
        roomId: selectedChat.id,
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
        await sendEncryptedMessage(selectedChat.id, selfId, `Shared a file: ${file.name}`, publicKey, privateKey, [attachment]);
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

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.participants.map(p => p.name.split(' ')[0]).join(', ');
    }
    return chat.participants[0]?.name || 'Unknown';
  };

  return (
    <div className="flex-1 flex bg-background">
      {/* Chat List */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="h-12 border-b flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Chat</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Edit className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Chat</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsNewChatOpen(true)}>
                  Start new chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsNewGroupOpen(true)}>
                  Create group
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Open chat settings')} className="gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-9 h-8 bg-muted border-none"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-auto teams-scrollbar">
          {/* Pinned Section */}
          {chatsState.some(c => c.isPinned) && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <Pin className="w-3 h-3" />
                Pinned
              </div>
              {chatsState.filter(c => c.isPinned).map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat?.id === chat.id}
                  onClick={() => setSelectedChat(chat)}
                  getName={getChatName}
                />
              ))}
            </div>
          )}

          {/* Recent Section */}
          <div className="p-2">
            <div className="px-2 py-1 text-xs text-muted-foreground">Recent</div>
            {chatsState.filter(c => !c.isPinned).map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isSelected={selectedChat?.id === chat.id}
                onClick={() => setSelectedChat(chat)}
                getName={getChatName}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Chat Content */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-12 border-b flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {selectedChat.type === 'direct' ? (
                <UserAvatar user={selectedChat.participants[0]} showStatus />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-foreground">
                    {selectedChat.participants.length}
                  </span>
                </div>
              )}
              <div>
                <h2 className="font-semibold text-sm">{getChatName(selectedChat)}</h2>
                {selectedChat.type === 'direct' && (
                  <p className="text-xs text-muted-foreground">
                    {selectedChat.participants[0]?.statusMessage || selectedChat.participants[0]?.status}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Phone className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Conversation</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setCallType('video'); setCallLink(`https://meet.example/${Date.now()}`); setIsCallDialogOpen(true); }} className="gap-2">
                    <Video className="w-4 h-4" />
                    Start video call
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setCallType('voice'); setCallLink(`https://voice.example/${Date.now()}`); setIsCallDialogOpen(true); }} className="gap-2">
                    <Phone className="w-4 h-4" />
                    Start voice call
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toast.info('Open conversation settings')} className="gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto teams-scrollbar p-4 space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentUser.id;
              const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
              const user = isOwn ? currentUser : users.find(u => u.id === message.senderId) || users[0];

              return (
                <div key={message.id} className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
                  {showAvatar ? (
                    <UserAvatar user={user} size="md" />
                  ) : (
                    <div className="w-8" />
                  )}
                  <div className={cn('max-w-[70%]', isOwn && 'items-end')}>
                    {showAvatar && (
                      <div className={cn('flex items-center gap-2 mb-1', isOwn && 'flex-row-reverse')}>
                        <span className="text-sm font-semibold">{message.senderName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    <div className={cn(
                      'p-3 rounded-lg',
                      isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <p className="text-sm">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              onClick={() => handleDownloadAttachment({ id: attachment.id, name: attachment.name })}
                              className="flex items-center gap-2 p-2 rounded border bg-muted/50 max-w-xs hover:bg-muted"
                            >
                              <span className="text-sm truncate">{attachment.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                  placeholder="Type a new message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 text-muted-foreground"
                >
                  <Smile className="w-4 h-4" />
                </Button>
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
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a chat to start messaging
        </div>
      )}

      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select
              className="w-full border rounded-md h-9 px-2 bg-background"
              value={newChatUserId}
              onChange={(e) => setNewChatUserId(e.target.value)}
            >
              <option value="">Select a user</option>
              {users.filter(u => u.id !== currentUser.id).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!newChatUserId) return;
                const user = users.find(u => u.id === newChatUserId);
                if (!user) return;
                const newChat: Chat = {
                  id: `chat-${Date.now()}`,
                  type: 'direct',
                  participants: [currentUser, user],
                } as Chat;
                setChatsState((prev) => [newChat, ...prev]);
                setSelectedChat(newChat);
                setIsNewChatOpen(false);
                setNewChatUserId('');
                toast.success('Chat started');
              }}
            >
              Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-auto">
            {users.filter(u => u.id !== currentUser.id).map(u => {
              const checked = groupUserIds.includes(u.id);
              return (
                <label key={u.id} className="flex items-center gap-2 p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setGroupUserIds((prev) => checked ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                  />
                  <span>{u.name}</span>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (groupUserIds.length === 0) return;
                const participants = [currentUser, ...users.filter(u => groupUserIds.includes(u.id))];
                const newChat: Chat = {
                  id: `chat-${Date.now()}`,
                  type: 'group',
                  participants,
                } as Chat;
                setChatsState((prev) => [newChat, ...prev]);
                setSelectedChat(newChat);
                setGroupUserIds([]);
                setIsNewGroupOpen(false);
                toast.success('Group created');
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{callType === 'video' ? 'Video Call' : 'Voice Call'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">{selectedChat ? getChatName(selectedChat) : ''}</div>
            <div className="text-xs text-muted-foreground break-all">{callLink}</div>
          </div>
          <DialogFooter>
            <Button onClick={() => window.open(callLink, '_blank')}>Join</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
  getName: (chat: Chat) => string;
}

function ChatListItem({ chat, isSelected, onClick, getName }: ChatListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-2 rounded-md flex items-center gap-3 text-left transition-colors',
        isSelected ? 'bg-teams-active' : 'hover:bg-teams-hover'
      )}
    >
      {chat.type === 'direct' ? (
        <UserAvatar user={chat.participants[0]} showStatus />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs font-semibold text-primary-foreground">
            {chat.participants.length}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{getName(chat)}</span>
          {chat.lastMessage && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(chat.lastMessage.timestamp, { addSuffix: false })}
            </span>
          )}
        </div>
        {chat.lastMessage && (
          <p className="text-xs text-muted-foreground truncate">
            {chat.lastMessage.content}
          </p>
        )}
      </div>
      {chat.unreadCount && chat.unreadCount > 0 && (
        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
          {chat.unreadCount}
        </span>
      )}
    </button>
  );
}
