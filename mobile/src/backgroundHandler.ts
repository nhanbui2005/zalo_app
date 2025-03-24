// import { getApp } from '@react-native-firebase/app';
// import { getMessaging, FirebaseMessagingTypes } from '@react-native-firebase/messaging';
// import NetInfo from '@react-native-community/netinfo';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { connectSocket } from './socket/socket';

// const messaging = getMessaging(getApp());

// messaging.setBackgroundMessageHandler(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
//   const data = remoteMessage.data as { type: string; [key: string]: string } | undefined;
//   if (data?.type === 'check_wifi') {
//     const state = await NetInfo.fetch();
//     if (state.isConnected && state.type === 'wifi') {
//       const accessToken = await AsyncStorage.getItem('accessToken');
//       if (accessToken) {
//         const newSocket = connectSocket('notifications', accessToken);
//         newSocket.emit('wifi_alive');
//         newSocket.disconnect();
//       }
//     }
//   }
// });