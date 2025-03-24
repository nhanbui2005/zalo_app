import BackgroundActions from 'react-native-background-actions';
import NetInfo from '@react-native-community/netinfo';
import { clearSocker, connectSocket, disconnectSocket, isSocketConnected } from './socket/socket';
import { syncNewMessage, syncPendingMessages } from './features/message/messageSync';
import { _MessageSentRes } from './features/message/dto/message.dto.parent';
import MessageRepository from './database/repositories/MessageRepository';
import { database } from './database';
import RoomRepository from './database/repositories/RoomRepository';

// Hàm chạy trong background
const backgroundSocketTask = async (taskData) => {
  const messageRepo = new MessageRepository();
  const roomRepo = new RoomRepository();
  const { namespace, accessToken, userId } = taskData;
  let socket : any = null;
  let previousState: any = null;

  // Hàm thiết lập socket và listener
  const setupSocket = () => {
    // Nếu socket đã kết nối, không làm gì
    if (isSocketConnected(namespace)) {
      return;
    }
    
    clearSocker(namespace);
    socket = connectSocket(namespace, accessToken);

    // Thiết lập các listener
    socket.on('load_more_msgs_when_connect', async (data) => {
      console.log('Load more messages when connected');
      try {
        await syncPendingMessages(data, roomRepo, messageRepo);
      } catch (error) {
        console.error('Error syncing pending messages:', error);
      }
    });

    socket.on('new_message', async (newMessage) => {
      try {
        await syncNewMessage(newMessage, roomRepo, messageRepo);
        socket.emit('ack_message', newMessage.id);
      } catch (error) {
        console.error('Error syncing new message:', error);
      }
    });
  };

  // Kiểm tra trạng thái mạng ban đầu
  const initialState = await NetInfo.fetch();
  if (initialState.isConnected && accessToken && userId) {
    disconnectSocket(namespace);
    setupSocket();
  }
  previousState = initialState.isConnected;

  // Lắng nghe thay đổi mạng
  const unsubscribe = NetInfo.addEventListener((state) => {
    const isConnected = state.isConnected;
    if (previousState !== isConnected && accessToken && userId) {
      if (isConnected) {
        setupSocket();
      } else {
        disconnectSocket(namespace);
        socket = null;
      }
      previousState = isConnected;
    }
  });

  // Giữ task sống mà không tạo kết nối dư thừa
  await new Promise((resolve) => {
    const checkRunning = setInterval(() => {
      
      // Chỉ kết nối lại nếu socket không kết nối và mạng khả dụng
      if (!isSocketConnected(namespace) && previousState) {
        setupSocket();
      }
      if (!BackgroundActions.isRunning()) {
        clearInterval(checkRunning);
        resolve(null);
      }
    }, 5000);
  });

  unsubscribe();
  if (socket) {
    disconnectSocket(namespace);
  }
};

export const startBackgroundSocketTask = async (
  namespace: string,
  accessToken: string,
  userId: string,
) => {
  const options = {
    taskName: 'SocketNetworkChecker',
    taskTitle: 'Socket Connection Manager',
    taskDesc: 'Managing socket connection in background',
    taskIcon: { name: 'ic_launcher', type: 'mipmap' },
    color: '#ff00ff',
    parameters: { namespace, accessToken, userId },
    foregroundServiceType: 'dataSync',
    silent: true
  };

  try {
    await BackgroundActions.start(backgroundSocketTask, options);
    console.log('Background task started');
  } catch (error) {
    console.error('Error starting background task:', error);
  }
};

// Hàm dừng background task
export const stopBackgroundSocketTask = async () => {
  try {
    await BackgroundActions.stop();
    console.log('Background task stopped');
  } catch (error) {
    console.error('Error stopping background task:', error);
  }
};