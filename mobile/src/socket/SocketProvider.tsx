// providers/SocketProvider.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  connectSocket,
  disconnectSocket,
  emitEvent,
  onEvent,
  offEvent,
} from './socket';
import { useSelector } from 'react-redux';
import { authSelector } from '~/features/auth/authSlice';
import RoomRepository from '~/database/repositories/RoomRepository';
import { syncEmojisWhenConnect, syncNewEmojisMessage, syncNewMessage, syncPendingMessages } from '~/features/message/messageSync';
import { _MessageSentRes } from '~/features/message/dto/message.dto.parent';
import MessageRepository from '~/database/repositories/MessageRepository';
import UserRepository from '~/database/repositories/UserRepository';
import { appSelector } from '~/features/app/appSlice';
import { useRoomStore } from '~/stores/zustand/room.store';
import { EmojiRepository } from '~/database/repositories/EmojiRepository';
import { useChatStore } from '~/stores/zustand/chat.store';

// Định nghĩa kiểu dữ liệu cho context
interface SocketContextType {
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  isConnected: boolean;
}

interface SocketProviderProps {
  namespace: string;
  children: ReactNode;
}

export interface FriendStatusSocket {
  userId: string;
  isOnline: boolean;
  lastOnline: Date;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Định nghĩa các sự kiện cho từng namespace
const EVENT_LISTENERS: {
  [namespace: string]: { event: string; handler: (socket: any, ...args: any[]) => void }[];
} = {
  notifications: [
    {
      event: 'load_more_msgs_when_connect',
      handler: async (socket, data, roomRepo, messageRepo) => {
        try {
          console.log('load_more_msgs_when_connect:', data);
          await syncPendingMessages(data, roomRepo, messageRepo);
        } catch (error) {
          console.error('Error syncing pending messages:', error);
        }
      },
    },
    {
      event: 'new_message',
      handler: async (socket, newMessage: _MessageSentRes, roomRepo, messageRepo) => {
        try {
          await syncNewMessage(newMessage, roomRepo, messageRepo);
          socket.emit('ack_message', newMessage.id);
        } catch (error) {
          console.error('Error syncing new message:', error);
        }
      },
    },
    {
      event: 'friend_status',
      handler: async (socket, friendStatus: FriendStatusSocket, userRepo) => {
        try {
          userRepo.updateOnlineStatus(friendStatus);
        } catch (error) {
          console.error('Error updating friend status:', error);
        }
      },
    },
  ],
  messages: [
    {
      event: 'writing-message',
      handler: (socket, data: { userName: string; status: boolean }, resetMemberWriting) => {
        resetMemberWriting(data.userName, data.status); 
      },
    },
    {
      event: 'new-emojis-message',
      handler: async (socket, data: { messageId: string; userId: string; emoji: string[]; createdAt: Date }) => {
        console.log('emojis-message:', data);
        const emojiRepository = new EmojiRepository();
        await syncNewEmojisMessage(data, emojiRepository);
      },
    },
    {
      event: 'emojis-when-connect',
      handler: async (socket, data: { [messageId: string]: Array<{ userId: string; emoji: string; createdAt: Date }> }) => {
        console.log('emojis-when-connect:', data);
        const emojiRepository = new EmojiRepository();
        await syncEmojisWhenConnect(data, emojiRepository);
      },
    },
  ],
};

export const SocketProvider: React.FC<SocketProviderProps> = ({
  namespace,
  children,
}) => {
  const { accessToken } = useSelector(authSelector);
  const { meData } = useSelector(appSelector);
  const { resetMemberWriting } = useChatStore();
  const [isConnected, setIsConnected] = useState(false);

  const roomRepo = new RoomRepository();
  const userRepo = new UserRepository();
  const messageRepo = new MessageRepository();

  useEffect(() => {
    if (!accessToken || !meData?.id) {
      disconnectSocket(namespace);
      return;
    }

    const socket = connectSocket(namespace, accessToken);

    const handleConnect = () => {
      setIsConnected(true);
      console.log(`Socket connected for namespace: ${namespace}`);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log(`Socket disconnected for namespace: ${namespace}`);
    };

    const listeners = EVENT_LISTENERS[namespace] || [];
    const listenerCleanups: Array<() => void> = [];

    listeners.forEach(({ event, handler }) => {
      const wrappedHandler = (data: any) => {
        handler(socket, data, roomRepo, messageRepo, userRepo, resetMemberWriting);
      };
      socket.on(event, wrappedHandler);
      listenerCleanups.push(() => socket.off(event, wrappedHandler));
    });

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      listenerCleanups.forEach((cleanup) => cleanup());
      disconnectSocket(namespace);
    };
  }, [namespace, accessToken, meData?.id]);

  const socketActions: SocketContextType = {
    emit: (event, data) => emitEvent(namespace, event, data),
    on: (event, callback) => onEvent(namespace, event, callback),
    off: (event) => offEvent(namespace, event),
    isConnected,
  };

  return (
    <SocketContext.Provider value={socketActions}>
      {children}
    </SocketContext.Provider>
  );
};