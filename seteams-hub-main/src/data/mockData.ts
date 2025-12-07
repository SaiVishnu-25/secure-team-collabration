import { User, Team, Chat, Meeting, Activity, FileItem, Message } from '@/types/teams';

export const currentUser: User = {
  id: 'user-1',
  name: 'John Smith',
  email: 'john.smith@company.com',
  status: 'online',
  statusMessage: 'Available',
};

export const users: User[] = [
  currentUser,
  { id: 'user-2', name: 'Aarav Sharma', email: 'sarah.j@company.com', status: 'online' },
  { id: 'user-3', name: 'Rohan Mehta', email: 'mike.chen@company.com', status: 'away', statusMessage: 'In a meeting' },
  { id: 'user-4', name: 'Priya Iyer', email: 'emily.d@company.com', status: 'busy', statusMessage: 'Do not disturb' },
  { id: 'user-5', name: 'Arjun Patel', email: 'alex.w@company.com', status: 'offline' },
  { id: 'user-6', name: 'Anika Singh', email: 'jessica.b@company.com', status: 'online' },
  { id: 'user-7', name: 'Vikram Kapoor', email: 'david.lee@company.com', status: 'online' },
  { id: 'user-8', name: 'Neha Gupta', email: 'lisa.t@company.com', status: 'away' },
];

export const teams: Team[] = [
  {
    id: 'team-1',
    name: 'Product Development',
    description: 'Main product development team',
    memberCount: 24,
    channels: [
      { id: 'ch-1', name: 'General', isPrivate: false, memberCount: 24, unreadCount: 3 },
      { id: 'ch-2', name: 'Frontend', isPrivate: false, memberCount: 8 },
      { id: 'ch-3', name: 'Backend', isPrivate: false, memberCount: 10 },
      { id: 'ch-4', name: 'Design', isPrivate: false, memberCount: 6, unreadCount: 1 },
      { id: 'ch-5', name: 'Leadership', isPrivate: true, memberCount: 4 },
    ],
  },
  {
    id: 'team-2',
    name: 'Marketing',
    description: 'Marketing and communications team',
    memberCount: 12,
    channels: [
      { id: 'ch-6', name: 'General', isPrivate: false, memberCount: 12 },
      { id: 'ch-7', name: 'Campaigns', isPrivate: false, memberCount: 8, unreadCount: 5 },
      { id: 'ch-8', name: 'Social Media', isPrivate: false, memberCount: 4 },
    ],
  },
  {
    id: 'team-3',
    name: 'Human Resources',
    description: 'HR and people operations',
    memberCount: 8,
    channels: [
      { id: 'ch-9', name: 'General', isPrivate: false, memberCount: 8 },
      { id: 'ch-10', name: 'Recruitment', isPrivate: true, memberCount: 5 },
      { id: 'ch-11', name: 'Events', isPrivate: false, memberCount: 8 },
    ],
  },
  {
    id: 'team-4',
    name: 'Customer Success',
    description: 'Customer support and success team',
    memberCount: 15,
    channels: [
      { id: 'ch-12', name: 'General', isPrivate: false, memberCount: 15 },
      { id: 'ch-13', name: 'Escalations', isPrivate: true, memberCount: 6 },
      { id: 'ch-14', name: 'Feedback', isPrivate: false, memberCount: 10 },
    ],
  },
];

export const chats: Chat[] = [
  {
    id: 'chat-1',
    type: 'direct',
    participants: [users[1]],
    lastMessage: {
      id: 'msg-1',
      senderId: 'user-2',
      senderName: 'Aarav Sharma',
      content: 'Did you finish the presentation?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    unreadCount: 2,
    isPinned: true,
  },
  {
    id: 'chat-2',
    type: 'direct',
    participants: [users[2]],
    lastMessage: {
      id: 'msg-2',
      senderId: 'user-1',
      senderName: 'John Smith',
      content: 'Let me check the API docs',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
  },
  {
    id: 'chat-3',
    type: 'group',
    participants: [users[3], users[4], users[5]],
    lastMessage: {
      id: 'msg-3',
      senderId: 'user-4',
      senderName: 'Priya Iyer',
      content: 'The new design looks great!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
    unreadCount: 1,
  },
  {
    id: 'chat-4',
    type: 'direct',
    participants: [users[6]],
    lastMessage: {
      id: 'msg-4',
      senderId: 'user-7',
      senderName: 'Vikram Kapoor',
      content: 'Thanks for the help!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
  },
];

export const channelMessages: Message[] = [
  {
    id: 'cm-1',
    senderId: 'user-2',
    senderName: 'Aarav Sharma',
    content: 'Good morning everyone! 👋 Quick reminder that we have a team sync at 2 PM today.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    reactions: [{ emoji: '👍', count: 5, userIds: ['user-1', 'user-3', 'user-4', 'user-5', 'user-6'] }],
  },
  {
    id: 'cm-2',
    senderId: 'user-3',
    senderName: 'Rohan Mehta',
    content: 'I\'ve pushed the latest updates to the staging environment. Could someone review the changes?',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    attachments: [{ id: 'att-1', name: 'deployment-notes.pdf', type: 'file', url: '#', size: 245000 }],
  },
  {
    id: 'cm-3',
    senderId: 'user-1',
    senderName: 'John Smith',
    content: 'Looking at it now! Will provide feedback shortly.',
    timestamp: new Date(Date.now() - 1000 * 60 * 85),
  },
  {
    id: 'cm-4',
    senderId: 'user-4',
    senderName: 'Priya Iyer',
    content: 'Here\'s the updated mockup for the dashboard redesign. Let me know your thoughts!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    attachments: [{ id: 'att-2', name: 'dashboard-v2.png', type: 'image', url: '#' }],
    reactions: [
      { emoji: '🎉', count: 3, userIds: ['user-1', 'user-2', 'user-3'] },
      { emoji: '❤️', count: 2, userIds: ['user-5', 'user-6'] },
    ],
  },
  {
    id: 'cm-5',
    senderId: 'user-6',
    senderName: 'Anika Singh',
    content: 'The design looks amazing! I especially love the new color scheme. Can we schedule a quick call to discuss the implementation timeline?',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
  },
];

export const meetings: Meeting[] = [
  {
    id: 'meet-1',
    title: 'Daily Standup',
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(9, 15, 0, 0)),
    organizer: users[1],
    participants: [users[0], users[1], users[2], users[3]],
    isRecurring: true,
    meetingLink: '#',
  },
  {
    id: 'meet-2',
    title: 'Product Review',
    startTime: new Date(new Date().setHours(11, 0, 0, 0)),
    endTime: new Date(new Date().setHours(12, 0, 0, 0)),
    organizer: users[0],
    participants: [users[0], users[1], users[4], users[5]],
    meetingLink: '#',
  },
  {
    id: 'meet-3',
    title: 'Team Sync',
    startTime: new Date(new Date().setHours(14, 0, 0, 0)),
    endTime: new Date(new Date().setHours(14, 30, 0, 0)),
    organizer: users[1],
    participants: users.slice(0, 6),
    isRecurring: true,
    meetingLink: '#',
  },
  {
    id: 'meet-4',
    title: 'Client Demo',
    startTime: new Date(new Date().setHours(16, 0, 0, 0)),
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),
    organizer: users[3],
    participants: [users[0], users[3], users[6]],
    location: 'Conference Room A',
    meetingLink: '#',
  },
];

export const activities: Activity[] = [
  {
    id: 'act-1',
    type: 'mention',
    title: 'Aarav Sharma mentioned you',
    description: 'in Product Development > General',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    isRead: false,
  },
  {
    id: 'act-2',
    type: 'reply',
    title: 'Rohan Mehta replied to your message',
    description: 'Thanks for the feedback!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
  },
  {
    id: 'act-3',
    type: 'meeting',
    title: 'Meeting starting soon',
    description: 'Team Sync in 15 minutes',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isRead: true,
  },
  {
    id: 'act-4',
    type: 'file',
    title: 'Priya Iyer shared a file',
    description: 'dashboard-v2.png in Design channel',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    isRead: true,
  },
  {
    id: 'act-5',
    type: 'reaction',
    title: '3 people reacted to your message',
    description: '👍 in Product Development > General',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    isRead: true,
  },
];

export const files: FileItem[] = [
  {
    id: 'file-1',
    name: 'Project Documents',
    type: 'folder',
    modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    modifiedBy: users[0],
  },
  {
    id: 'file-2',
    name: 'Design Assets',
    type: 'folder',
    modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    modifiedBy: users[3],
  },
  {
    id: 'file-3',
    name: 'Q4 Report.xlsx',
    type: 'file',
    mimeType: 'application/vnd.ms-excel',
    size: 524288,
    modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    modifiedBy: users[1],
  },
  {
    id: 'file-4',
    name: 'Product Roadmap.pptx',
    type: 'file',
    mimeType: 'application/vnd.ms-powerpoint',
    size: 2097152,
    modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    modifiedBy: users[2],
  },
  {
    id: 'file-5',
    name: 'Meeting Notes.docx',
    type: 'file',
    mimeType: 'application/vnd.ms-word',
    size: 102400,
    modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    modifiedBy: users[0],
  },
  {
    id: 'file-6',
    name: 'Brand Guidelines.pdf',
    type: 'file',
    mimeType: 'application/pdf',
    size: 5242880,
    modifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    modifiedBy: users[3],
  },
];
