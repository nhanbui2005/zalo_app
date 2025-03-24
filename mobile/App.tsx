import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import { useAuthSelector } from '~/stores/redux/store'; 
import AppRouters from '~/routers/AppNavigator';
import { authSelector } from '~/features/auth/authSlice';
import { appSelector, setNetworkState } from '~/features/app/appSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuth } from '~/features/auth/authSlice';
import { setMe } from '~/features/app/appSlice';
import { userApi } from '~/features/user/userService';
import { setAuthorizationToken } from '~/configs/axiosInstance';
import { AUTH_ASYNC_STORAGE_KEY, ME_ASYNC_STORAGE_KEY } from '~/utils/Constants/authConstant';
import { SocketProvider } from '~/socket/SocketProvider';
import NetInfo from '@react-native-community/netinfo';
import { startBackgroundSocketTask } from '~/backgroundSocketManager';


const App = () => {
  const { accessToken } = useAuthSelector(authSelector);
  const { meData } = useSelector(appSelector);
  const dispatch = useDispatch();
  

  // Hàm kiểm tra trạng thái Wi-Fi
  const checkNetwork = async () => {
    try {
      const state = await NetInfo.fetch();
      const isWifiConnected = state.type === 'wifi';
      dispatch(setNetworkState(isWifiConnected));
      console.log('Initial Wi-Fi state:', isWifiConnected);
    } catch (error) {
      console.error('Error checking network:', error);
      dispatch(setNetworkState(false)); 
    }
  };

  useEffect(() => {
    
    checkNetwork();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isWifiConnected = state.type === 'wifi';
      dispatch(setNetworkState(isWifiConnected));
      console.log('Wi-Fi state changed:', isWifiConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const auth = await AsyncStorage.getItem(AUTH_ASYNC_STORAGE_KEY);
        const me = await AsyncStorage.getItem(ME_ASYNC_STORAGE_KEY);

        if (auth) {
          const parsedAuth = JSON.parse(auth);
          setAuthorizationToken(parsedAuth.accessToken);
          dispatch(setAuth(parsedAuth));
        }
        if (me) {
          const parsedMe = JSON.parse(me);
          dispatch(setMe(parsedMe));
        } else if (accessToken) {
          const meData = await userApi.getCurrentUser();
          dispatch(setMe(meData));
          await AsyncStorage.setItem(ME_ASYNC_STORAGE_KEY, JSON.stringify(meData));
        }
      } catch (error) {
        console.error('Error in checkLogin:', error);
      }
    };

    checkLogin().catch(error => console.error('checkLogin failed:', error));
  }, [accessToken, meData?.id, dispatch]);

  if ( accessToken && meData) {
    startBackgroundSocketTask('notifications',accessToken, meData?.id, )
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <SocketProvider namespace={'notifications'}>
          <AppRouters authData={accessToken} />
        </SocketProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;