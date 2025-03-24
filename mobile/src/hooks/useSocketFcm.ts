import { useEffect } from 'react';
import { getMessaging, FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import NetInfo from '@react-native-community/netinfo';
import { Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { appSelector } from '~/features/app/appSlice';
import { getApp } from '@react-native-firebase/app';

const messaging = getMessaging(getApp());

const useSocketFcm = (socket: Socket) => {
  const { meData } = useSelector(appSelector);

  useEffect(() => {
    if (!socket || !meData?.id) {
      console.warn('Socket hoặc userId không khả dụng, bỏ qua đăng ký FCM token.');
      return;
    }

    // Lấy FCM token và gửi cho backend
    const registerFcmToken = async () => {
      try {
        const token = await messaging.getToken();
        socket.emit('registerFcmToken', { userId: meData.id, token });
      } catch (error) {
        console.error('Error getting FCM token:', error);
      }
    };

    // Kiểm tra quyền thông báo trước khi lấy token
    const checkPermissionAndRegister = async () => {
      try {
        const authStatus = await messaging.hasPermission();
        // Kiểm tra trạng thái quyền bằng giá trị số
        const enabled = authStatus === 1 || authStatus === 2; // 1: AUTHORIZED, 2: PROVISIONAL

        if (!enabled) {
          const newStatus = await messaging.requestPermission();
          console.log('User granted permission:', newStatus);
        }

        await registerFcmToken();
      } catch (error) {
        console.error('Error checking FCM permission:', error);
      }
    };

    checkPermissionAndRegister();

    // Xử lý khi nhận FCM trong foreground
    const unsubscribe = messaging.onMessage(async (remoteMessage) => {
      try {
        if (remoteMessage.data?.type === 'check_wifi') {
          const state = await NetInfo.fetch();
          if (state.isConnected && state.type === 'wifi') {
            socket.emit('wifi_alive');
          } else {
            console.log('Not connected to wifi:', state);
          }
        }
      } catch (error) {
        console.error('Error handling FCM message:', error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [socket, meData?.id]);
};

export default useSocketFcm;