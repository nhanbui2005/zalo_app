import React, {useCallback, useRef, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {MainNavProp} from '../../routers/types';
import {colors} from '../../styles/Ui/colors';
import AppBar from '../../components/Common/AppBar';
import {
  _MessageSentReq,
  _MessageSentRes,
} from '~/features/message/dto/message.dto.parent';
import {RoomService} from '~/features/room/roomService';
import {useChatStore} from '~/stores/zustand/chat.store';
import {SocketProvider} from '~/socket/SocketProvider';
import UModal, {UModalRef} from '~/components/Common/modal/UModal';
import BottomSheetComponent from './components/bottomSheet/__index';
import ReplyMessageComponent, {
  ReplyMessageRef,
} from './components/bottomSheet/ReplyMessage';
import StatusChat from './components/bottomSheet/StatusChat';
import MessageListView from './components/listMessages';
import RoomRepository from '~/database/repositories/RoomRepository';
import {Room} from '~/features/room/dto/room.dto.nested';
import {useRoomStore} from '~/stores/zustand/room.store';
import { emitEvent } from '~/socket/socket';
import MemberRepository from '~/database/repositories/MemberRepository';
import { MMKVStore } from '~/utils/storage';
import MessageRepository from '~/database/repositories/MessageRepository';
import { MessageContentType, MessageViewStatus } from '~/features/message/dto/message.enum';
import { KeyItemMenu } from '~/components/Common/modal/content/ModelContent_MenuMessage';
import { MessagParente } from '~/features/message/dto/message.dto.nested';
import ModalContent_MenuMessage from '~/components/Common/modal/content/ModelContent_MenuMessage';
import { nanoid } from 'nanoid/non-secure';

const ChatScreen: React.FC = () => {
  const mainNav = useNavigation<MainNavProp>();
  const currentRoomId = MMKVStore.getCurrentRoomId()
  const {curentMessageRepling, clearData, setCurentMessageRepling} = useChatStore();
  const {currentPartnerId,setCurrentRoom} = useRoomStore();
  const [room, setRoom] = useState<Room>();

  const modalRef = useRef<UModalRef>(null);
  const replyMessageRef = useRef<ReplyMessageRef>(null);
  const messageSelectedRef = useRef<_MessageSentRes>();
  const inputText = useRef('');
  const isFocused = useIsFocused();
  
  // Set chặn notifi khi ở chatscreen
  useEffect(() => {    
    if (isFocused) {
      MMKVStore.setAllowNotification(false); 
    }
    return () => {
      MMKVStore.setAllowNotification(true)
      MMKVStore.setCurrentRoomId("")
    };
  }, [isFocused]);

  // Setup data
  useEffect(() => {    
    const setData = async (): Promise<void> => {
      try {
        const roomRepo = RoomRepository.getInstance()
        const memberRepo = MemberRepository.getInstance()
        let roomIdTemp: any;
        if (currentRoomId) {
          roomIdTemp = currentRoomId;
          const roomData = await roomRepo.getRoomById(currentRoomId)
          if (roomData) {            
            setRoom(roomData)
            setCurrentRoom({
              roomAvatar: roomData.roomAvatar, 
              roomName: roomData.roomName
            });
          }
        } else {
          if (currentPartnerId) {
            const res = await RoomService.findOneByPartnerId(currentPartnerId);
            setRoom(res)
            setCurrentRoom({
              roomAvatar: res.roomAvatar, 
              roomName: res.roomName
            });
            MMKVStore.setCurrentRoomId(res.id);
            roomIdTemp = res.id;
          }
        }
      } catch (error: any) {}
    };
    setData();

    return () => {
      // Nếu đang có tin nhắn đang reply, cập nhật lastMessage
      if (curentMessageRepling) {
        const roomRepo = RoomRepository.getInstance();
        const messageRepo = MessageRepository.getInstance();
        const messageModel = messageRepo.prepareMessages([{
          roomId: currentRoomId,
          messages: [{
            id: `temp-${nanoid()}`,
            content: '[Trả lời]',
            type: MessageContentType.TEXT,
            status: MessageViewStatus.SENT,
            revoked: false,
            senderId: curentMessageRepling.sender?.id || '',
            roomId: currentRoomId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]
        }]);
        roomRepo.updateRoomLastMessage(currentRoomId, messageModel[0], 0);
      }
      clearData();
      emitEvent('messages','leave-room', {roomId: currentRoomId});
    };
  }, []);

  //vào room reset lại unread
  useEffect(() => {
    const roomRepo = RoomRepository.getInstance();
    if (currentRoomId) roomRepo.resetRoomUnreadCount(currentRoomId);
  }, []);

  const handleInputChange = useCallback((text: string) => {
    inputText.current = text;
  }, []);

  const handleEmojiChange = useCallback((text: string) => {
    inputText.current += text;
  }, []);

  const handleItemMenuPress = (key: KeyItemMenu) => {
    switch (key) {
      case KeyItemMenu.REPLY:
        if (messageSelectedRef.current) {
          const replyMessage: MessagParente = {
            id: messageSelectedRef.current.id,
            content: messageSelectedRef.current.content || '',
            sender: messageSelectedRef.current.sender || {
              id: '',
              msgRTime: new Date(),
              msgVTime: new Date(),
              role: '',
              user: {
                id: '',
                username: 'Unknown',
                isActive: true,
                isVerify: false,
                lastAccessed: new Date(),
                isOnline: false,
                lastOnline: new Date()
              }
            },
            type: messageSelectedRef.current.type,
            createdAt: new Date(messageSelectedRef.current.createdAt || Date.now())
          };
          setCurentMessageRepling(replyMessage);
          modalRef.current?.close();
          if (replyMessageRef.current) {
            replyMessageRef.current.show(true, true);
          } else {
            console.log('ReplyMessageRef is null');
          }
        }
        break;
      case KeyItemMenu.FORWARD:
        break;
      case KeyItemMenu.SAVE_CLOUD:
        break;
      case KeyItemMenu.RECALL:
        break;
      case KeyItemMenu.COPY:
        break;
      case KeyItemMenu.PIN:
        break;
      case KeyItemMenu.REMINDER:
        break;
      case KeyItemMenu.MULTI_SELECT:
        break;
      case KeyItemMenu.QUICK_MESSAGE:
        break;
      case KeyItemMenu.TEXT_READER:
        break;
      case KeyItemMenu.DETAILS:
        break;
      case KeyItemMenu.DELETE:
        break;
    }
  };

  const handleLongItemPress = (pageY: number, message: any) => {  
    messageSelectedRef.current = message;
    modalRef.current?.open(
      <ModalContent_MenuMessage
        pageY={pageY}
        message={message}
        onItemPress={handleItemMenuPress}
      />
    );
  };

  return (
    <SocketProvider namespace='messages'>
      <View style={styles.container}>
        <UModal ref={modalRef} />
        {/* AppBar */}
        <AppBar
          title={room?.roomName ?? ''}
          description="1 giờ trước"
          iconButtonLeft={['back']}
          iconButtonRight={['call', 'video_call', 'menu']}
          onChangeInputText={text => console.log('Input changed:', text)}
          onPress={action => {
            switch (action) {
              case 'back':
                mainNav.goBack();
                break;
            }
          }}
          style={{
            backgroundColor: colors.primary,
            position: 'absolute',
            zIndex: 1,
          }}
        />

        <MessageListView onLongItemPress={handleLongItemPress} />
        <StatusChat isGroup={room?.memberCount != 2} />
        <ReplyMessageComponent ref={replyMessageRef} />

        <BottomSheetComponent
          roomId={currentRoomId}
          onTextChange={handleInputChange}
          onEmojiChange={handleEmojiChange}
        />
      </View>
    </SocketProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background_mess,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
});

export default ChatScreen;
