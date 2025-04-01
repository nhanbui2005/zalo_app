import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';

const menuItems = [
  { id: '1', title: 'Vị trí', icon: '📍' },
  { id: '2', title: 'Tài liệu', icon: '📎' },
  { id: '3', title: 'Nhắc hẹn', icon: '⏰' },
  { id: '4', title: 'Tin nhắn nhanh', icon: '⚡' },
  { id: '5', title: 'Chuyển khoản', icon: '💰' },
  { id: '6', title: 'Danh thiếp', icon: '👤' },
  { id: '7', title: 'Cloud của tôi', icon: '☁️' },
  { id: '8', title: 'Gửi số tài khoản', icon: '💳' },
  { id: '9', title: 'GIF', icon: '🎞️' },
  { id: '10', title: 'Vẽ hình', icon: '✍️' },
  { id: '11', title: 'Kiểu chữ', icon: '🔠' },
];

const MenuList = () => {
  const handleMenuPress = (item: { id: string; title: string }) => {
    switch (item.title) {
      case 'Tài liệu':
        openDocument();
        break;
      case 'Vị trí':
        showLocation();
        break;
      case 'Nhắc hẹn':
        setReminder();
        break;
      default:
        Alert.alert('Chức năng', `Bạn đã chọn: ${item.title}`);
    }
  };

  const openDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles], // Chọn tất cả loại file
      });

      console.log('File đã chọn:', result);
      Alert.alert('Tệp đã chọn', result[0]?.name ?? 'Không có tệp nào');
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('Người dùng đã hủy chọn tệp');
      } else {
        console.error('Lỗi khi chọn tệp:', err);
      }
    }
  };


  const showLocation = () => {
    Alert.alert('Chia sẻ vị trí', 'Chức năng chia sẻ vị trí đang được phát triển.');
  };

  const setReminder = () => {
    Alert.alert('Nhắc hẹn', 'Chức năng nhắc hẹn đang được phát triển.');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(item)}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.text}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  icon: { fontSize: 24 },
  text: { marginTop: 5, fontSize: 14, fontWeight: 'bold' },
});

export default MenuList;
