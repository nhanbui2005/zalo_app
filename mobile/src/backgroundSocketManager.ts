import BackgroundActions from 'react-native-background-actions';
import NetInfo from '@react-native-community/netinfo';
import { clearSocker, connectSocket, disconnectSocket, isSocketConnected } from './socket/socket';
import { syncNewMessage, syncPendingMessages } from './features/message/messageSync';
import { _MessageSentRes } from './features/message/dto/message.dto.parent';
import MessageRepository from './database/repositories/MessageRepository';
import RoomRepository from './database/repositories/RoomRepository';
import { syncWhenAcceptRequest } from './features/relation/relationService';
import { HandleAcceptReqDataSocket } from './socket/types/relation';
import { keyMMKVStore, MMKVStore, storage } from './utils/storage';
import { syncUserStatus } from './features/user/userSync';
import UserRepository from './database/repositories/UserRepository';

// Hàm chạy trong background
const backgroundSocketTask = async (taskData) => {
  const messageRepo = MessageRepository.getInstance();
  const roomRepo = RoomRepository.getInstance();
  const userRepo = UserRepository.getInstance();
  const setMemberMyIds = MMKVStore.getSetMemberIdsFromMMKV(); 
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
      try {
        await syncPendingMessages(data, roomRepo, messageRepo);
      } catch (error) {
        console.error('Error syncing pending messages:', error);
      }
    });
    socket.on('received_msg', async (data)=>{
      try {
        const {userId, receivedAt} = data
        await syncUserStatus(userId, receivedAt, userRepo)
      } catch (error) {
        
      }
    })

    socket.on('new_message', async (data) => {
      try {        
        if (data.senderId) {
          if ( setMemberMyIds.has(data.senderId)) return
        }            
      await syncNewMessage(data, roomRepo, messageRepo, );
      } catch (error) {
        console.error('Error syncing new message:', error);
      }
    });

    socket.on('notify.update-relation_req', async (data : HandleAcceptReqDataSocket) => {
      try {
        const myId = storage.getString(keyMMKVStore.USER_ID) as string
        await syncWhenAcceptRequest({
          meId: myId,
          handlerId: data.user.id,
          requesterId: myId ,
          memberId: data.memberId,
          memberMeId: data.memberMeId,
          room: data.room,
          userBase: data.user
        });
      } catch (error) {
        console.error('Error syncing pending messages:', error);
      }
    })
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