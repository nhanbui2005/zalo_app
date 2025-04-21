import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { MessageService } from '~/features/message/messageService';
import { MessageContentType } from '~/features/message/dto/message.enum';
import { _MessageSentReq } from '~/features/message/dto/message.dto.parent';
import type { File } from '~/features/message/messageService';
import { MMKVStore } from '~/utils/storage';
import { useChatStore } from '~/stores/zustand/chat.store';
import { Assets } from '~/styles/Ui/assets';
import { colors } from '~/styles/Ui/colors';

const menuItems = [
  { 
    id: '1', 
    title: 'Vị trí', 
    icon: Assets.icons.location,
    bgColor: '#FF6B6B'
  },
  { 
    id: '2', 
    title: 'Tài liệu', 
    icon: Assets.icons.doc,
    bgColor: '#4759FF'
  },
  { 
    id: '3', 
    title: 'Nhắc hẹn', 
    icon: Assets.icons.alam,
    bgColor: '#FF4F9A'
  },
  { 
    id: '4', 
    title: 'Tin nhắn nhanh', 
    icon: Assets.icons.alam,
    bgColor: '#1ABC9C'
  },
  { 
    id: '5', 
    title: 'Chuyển khoản', 
    icon: Assets.icons.cash_back,
    bgColor: '#2ECC71'
  },
  { 
    id: '6', 
    title: 'Danh thiếp', 
    icon: Assets.icons.business_card,
    bgColor: '#3498DB'
  },
  { 
    id: '7', 
    title: 'Cloud của tôi', 
    icon: Assets.icons.cloud,
    bgColor: '#4834D4'
  },
  { 
    id: '8', 
    title: 'Gửi số tài khoản', 
    icon: Assets.icons.alam,
    bgColor: '#6C5CE7'
  },
  { 
    id: '9', 
    title: 'GIF', 
    icon: Assets.icons.alam,
    bgColor: '#A8E6CF'
  },
  { 
    id: '10', 
    title: 'Vẽ hình', 
    icon: Assets.icons.alam,
    bgColor: '#FDCB6E'
  },
  { 
    id: '11', 
    title: 'Kiểu chữ', 
    icon: Assets.icons.add_white,
    bgColor: '#FFA502'
  },
  { 
    id: '12', 
    title: 'Live stream', 
    icon: Assets.icons.add_white,
    bgColor: '#FFA502'
  },
];

const MenuList = () => {
  const currentMemberMyId = MMKVStore.getCurrentMemberMeId();
  const currentRoomId = MMKVStore.getCurrentRoomId();
  const { curentMessageRepling } = useChatStore();

  const handleSendFile = async () => {
    try {
      console.log('📤 Chọn file');
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      console.log('réulkt', result);

      if (result) {
        const fileInfo = result[0];
        
        const dto: _MessageSentReq = {
          roomId: currentRoomId,
          content: '.',
          contentType: MessageContentType.FILE,
          replyMessageId: curentMessageRepling?.id,
        };

        const fileToSend = {
          uri: fileInfo.uri,
          fileName: fileInfo.name,
          type: fileInfo.type,
          bytes: fileInfo.size
        } as File;

        await MessageService.SentMessageMedia(dto, currentMemberMyId, [fileToSend]);
      }

    } catch (err) {
      console.log('Lỗi chọn file: ', err);
    }
  };

  const handleMenuPress = (item: { id: string; title: string }) => {
    switch (item.title) {
      case 'Tài liệu':
        handleSendFile();
        break;
      case 'Vị trí':
        showLocation();
        break;
      case 'Nhắc hẹn':
        setReminder();
        break;
    }
  };

  const showLocation = () => {
  };

  const setReminder = () => {
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        numColumns={4}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleMenuPress(item)}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: item.bgColor }
            ]}>
              <Image 
                source={item.icon} 
                style={[styles.icon, { tintColor: '#FFFFFF' }]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.text}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 10, 
    borderTopColor: colors.gray_light,
    borderTopWidth: 0.6,
    backgroundColor: '#fff' 
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: { 
    width: 24,
    height: 24,
  },
  text: { 
    fontSize: 12,
    color: colors.gray_icon,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default MenuList;
