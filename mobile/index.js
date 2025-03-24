import { AppRegistry, Platform } from 'react-native';
import { Provider } from 'react-redux';
import notifee from '@notifee/react-native';
import store from '~/stores/redux/store';
import App from './App';
import { name as appName } from './app.json';

// Hàm yêu cầu quyền thông báo
async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus === 0) {
    console.warn('Người dùng từ chối quyền thông báo!');
  } else {
    console.log('Quyền thông báo đã được cấp!');
  }
}

// Gọi ngay khi app khởi động
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  requestNotificationPermission();
}

const RootApp = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

AppRegistry.registerComponent(appName, () => RootApp);
