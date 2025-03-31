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
import { _MessageSentRes } from '~/features/message/dto/message.dto.parent';
import { useRoomStore } from '~/stores/zustand/room.store';
import { keyMMKVStore, storage } from '~/utils/storage';

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

export const SocketProvider: React.FC<SocketProviderProps> = ({
  namespace,
  children,
}) => {
  const { accessToken } = useSelector(authSelector);
  const {currentRoomId} = useRoomStore()
  const myId = storage.getString(keyMMKVStore.USER_ID)
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {

    if (!accessToken || !myId) {      
      disconnectSocket(namespace);
      return;
    }

    const socket = connectSocket(namespace, accessToken);

    const handleConnect = () => {
      if (!socket) {
        return;
      }
    
      if (!socket.connected) {    
        socket.once('connect', () => {
          console.log(`✅ Socket ${namespace} connected! Now joining room.`);
          setIsConnected(true);
          if (namespace === 'messages') {
            socket.emit('join-room', { roomId: currentRoomId });
          }
        });
    
        return;
      }
    
      // Nếu đã kết nối, emit ngay
      setIsConnected(true);
      if (namespace === 'messages') {
        socket.emit('join-room', { roomId: currentRoomId });
      }
      console.log(`✅ Socket connected for namespace: ${namespace}`);
    };
    
    

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log(`Socket disconnected for namespace: ${namespace}`);
    };


    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      // listenerCleanups.forEach((cleanup) => cleanup());
      disconnectSocket(namespace);
    };
  }, [namespace, accessToken,myId]);

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