import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assets } from 'react-native.config';
import { Assets } from '~/styles/Ui/assets';

const NetworkErrorScreen: React.FC = () => {
  const handleRetry = () => {
    console.log('Retry pressed');
    // Thêm logic thử lại kết nối tại đây
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Thanh trạng thái (StatusBar) */}
      <StatusBar backgroundColor="#2196F3" barStyle="light-content" />

      {/* Nội dung chính */}
      <View style={styles.content}>
        {/* Icon Wi-Fi */}
        <View style={styles.iconContainer}>
          <Image source={Assets.icons.no_wifi} style={styles.wifiIcon} />
        </View>

        {/* Thông báo */}
        <Text style={styles.message}>
          Không có kết nối.{'\n'}Vui lòng thử lại sau.
        </Text>

        {/* Nút Thử Lại */}
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>THỬ LẠI</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3', // Màu xanh của header
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backArrow: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 16,
    color: '#000000',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 20,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD', // Màu nền của icon
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wifiIcon: {
    width: 40,
    height: 40,
    tintColor: '#2196F3', // Màu xanh của icon
  },
  message: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default NetworkErrorScreen;