import { database } from '~/database';
import RoomRepository from '~/database/repositories/RoomRepository';
import MessageRepository from '~/database/repositories/MessageRepository';
import { _MessageSentRes } from './dto/message.dto.parent';
import { nanoid } from 'nanoid/non-secure';
import notifee, { AndroidImportance, AndroidStyle} from '@notifee/react-native';
import MessageModel from '~/database/models/MessageModel';
import { EmojiRepository } from '~/database/repositories/EmojiRepository';


export async function syncPendingMessages(
  pendingMessages: { roomId: string; messages: _MessageSentRes[] },
  roomRepository: RoomRepository,
  messageRepository: MessageRepository,
  allowNotification: boolean = true,
  currentRoomId?: string
): Promise<void> {
  console.log('lạp lại');
  

  const { roomId, messages } = pendingMessages
  
  const room = await roomRepository.getRoomById(roomId);

  const message = messages[messages.length - 1];

  try {    
    const messagesPrepare = await messageRepository.prepareMessages([pendingMessages]);
    let lastMessage: MessageModel | null = null;

    if (messagesPrepare.length > 0) {
      lastMessage = messagesPrepare[0]; 
    }
    
    await database.write(async () => {
      await messageRepository.batchMessages(messagesPrepare, false);
      await roomRepository.updateRoomLastMessage(
        messagesPrepare[0].roomId,
        lastMessage,
        pendingMessages.messages.length,
        false
      );
    });
    if (currentRoomId === roomId || !allowNotification) return

    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    // Gửi thông báo cục bộ bằng Notifee
    await notifee.displayNotification({
      data: { roomId },
      
      android: {
        channelId: 'default',
        
        style: {
          type: AndroidStyle.MESSAGING,
          person: {
            name: room.roomName,
            icon: room.roomAvatar,
          },
          messages: [
            {
              
              text: message.content || '.......',
              timestamp: Date.now(), // Thời gian hiện tại để hiển thị tin nhắn mới nhất
            },
          ],
          title: room.roomName,
        },
        importance: AndroidImportance.HIGH, // Đảm bảo mức độ ưu tiên cao
        autoCancel: false, // Ngăn thông báo tự động đóng
        showTimestamp: true, // Hiển thị thời gian để tăng tính trực quan
        pressAction: { id: 'default' }, // Cho phép nhấn vào thông báo
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
    console.log('7');

  } catch (error) {
    console.error('Failed to sync pending messages:', error);
    throw error;
  }
}

export async function syncNewMessage(
  newMessage: Partial<_MessageSentRes>,
  roomRepository: RoomRepository,
  messageRepository: MessageRepository,
): Promise<void> {
  if (!newMessage) return;
  
  const roomId = newMessage.roomId || `temp-${nanoid}`;
  const messageId = newMessage.id || `temp-${nanoid}`;

  try {
    const messagesPrepare = await messageRepository.prepareMessages([
      {
        roomId,
        messages: [{ ...newMessage, id: messageId }],
      },
    ]);

    if (messagesPrepare.length === 0) {
      console.warn('Không có tin nhắn để đồng bộ.');
      return;
    }

    await database.write(async () => {
      await messageRepository.batchMessages(messagesPrepare, false);
      await roomRepository.updateRoomLastMessage(roomId, messagesPrepare[0], 1, false);
    });

  } catch (error) {
    console.error(`Failed to sync new message ${messageId}:`, error);
    throw error;
  }
}

export const syncNewEmojisMessage = async (
  data: { messageId: string; userId: string; emoji: string[]; createdAt: Date },
  emojiRepository: EmojiRepository
) => {
  try {
    const { messageId, userId, emoji, createdAt } = data;
    const emojisToAdd = emoji.map(content => ({
      memberId: userId,
      messageId,
      content,
      createdAt,
    }));

    // Sử dụng repository để thêm emojis
    await emojiRepository.addEmojis(emojisToAdd);
  } catch (error) {
    console.error('Error handling new emojis message:', error);
  }
};

export const syncEmojisWhenConnect = async (
  data: { [messageId: string]: Array<{ userId: string; emoji: string; createdAt: Date }> },
  emojiRepository: EmojiRepository
) => {
  try {
    await database.action(async () => {
      for (const [messageId, serverEmojis] of Object.entries(data)) {
        await emojiRepository.resetEmojisForMessage(messageId, serverEmojis);
      }
    });
  } catch (error) {
    console.error('Error handling emojis when connect:', error);
  }
};