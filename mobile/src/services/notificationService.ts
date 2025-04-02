import notifee, { EventType, AndroidImportance, AndroidStyle } from '@notifee/react-native';
import MemberRepository from '~/database/repositories/MemberRepository';
import MessageRepository from '~/database/repositories/MessageRepository';
import RoomRepository from '~/database/repositories/RoomRepository';
import { _MessageSentReq } from '~/features/message/dto/message.dto.parent';
import { MessageContentType } from '~/features/message/dto/message.enum';
import { MessageService } from '~/features/message/messageService';
import { keyMMKVStore, MMKVStore, storage } from '~/utils/storage';

async function handleReplyNotification(roomId: string, message: string, notificationId: string) {
  try {
    const meId = storage.getString(keyMMKVStore.USER_ID);
    const roomRepo = RoomRepository.getInstance(); 
    const memberRepo = MemberRepository.getInstance();
    const messageRepo = MessageRepository.getInstance()

    const memberMeId = await memberRepo.getMemberMeId(roomId, meId ?? "");

    if (memberMeId) {
      const dto = {
        roomId: roomId.trim(),
        content: message,
        contentType: MessageContentType.TEXT,
      } as _MessageSentReq;    
      MMKVStore.setAllowNotification(false);

      await MessageService.SentMessageText(dto, memberMeId, roomRepo, messageRepo);
    }

   
    return;
  } catch (error) {
    console.error('❌ Lỗi khi gửi tin nhắn:', error);
  } finally {
    await notifee.cancelNotification(notificationId); 
}
}

// 🟢 Đăng ký lắng nghe sự kiện từ Notifee (Foreground & Background)
export function registerNotificationHandlers() {  
  const handleEvent = async({ type, detail }: { type: EventType; detail: any }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'reply') {
      const replyText = detail.input;
      const roomId = detail.notification?.data?.roomId;
      const notificationId = detail.notification?.id;

      
      if (roomId && replyText) {
      
        await handleReplyNotification(roomId, replyText, notificationId);
      }
    }         
  };

  // Foreground
  notifee.onForegroundEvent(handleEvent);

  // Background
  notifee.onBackgroundEvent(handleEvent);
}

// 🟢 Setup kênh thông báo
export async function setupNotificationChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

// 🟢 Gửi thông báo tin nhắn mới
export async function sendLocalNotification(roomId: string, roomName: string, roomAvatar: string, message: string) {    
  await notifee.displayNotification({
    data: { roomId },
    android: {
      channelId: 'default',
      style: {
        type: AndroidStyle.MESSAGING,
        person: {
          name: roomName,
          icon: roomAvatar,
        },
        messages: [
          {
            text: message || '.......',
            timestamp: Date.now(),
          },
        ],
        title: roomName,
      },
      importance: AndroidImportance.HIGH,
      autoCancel: false,
      showTimestamp: true,
      pressAction: { id: 'default' },
      actions: [
        {
          title: 'Trả lời',
          pressAction: { id: 'reply' },
          input: {
            placeholder: 'Nhập tin nhắn trả lời...',
            allowFreeFormInput: true,
          },
        },
        {
          title: 'Tắt báo 1 giờ',
          pressAction: { id: 'mute_1h' },
        },
      ],
    },
    ios: {
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
    },
  });
}
