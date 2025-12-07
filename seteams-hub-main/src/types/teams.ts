export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  statusMessage?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  reactions?: Reaction[];
  attachments?: Attachment[];
  isEdited?: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image' | 'link';
  url: string;
  size?: number;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
  unreadCount?: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  channels: Channel[];
  memberCount: number;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  isPinned?: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  organizer: User;
  participants: User[];
  isRecurring?: boolean;
  meetingLink?: string;
  location?: string;
}

export interface Activity {
  id: string;
  type: 'mention' | 'reply' | 'reaction' | 'meeting' | 'file';
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  sourceId?: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  modifiedAt: Date;
  modifiedBy: User;
  sharedWith?: User[];
}
