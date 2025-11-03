export interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
  userId: number;
}

export interface Message {
  id: number;
  chatId?: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  messageType: 'text' | 'image';
  imageData?: string;
  isRead: boolean;
}

export interface SSEMessage {
  type: 'connected' | 'new_message' | 'message_read' | 'user_online' | 'user_offline' | 'ping';
  message?: Message;
  messageId?: number;
  userId?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
}
