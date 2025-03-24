import React, {useCallback, useRef, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {MainNavProp} from '../../routers/types';
import {colors} from '../../styles/Ui/colors';
import AppBar from '../../components/Common/AppBar';
import {
  _MessageSentReq,
  _MessageSentRes,
} from '~/features/message/dto/message.dto.parent';
import {MessageViewStatus} from '~/features/message/dto/message.enum';
import {RoomService} from '~/features/room/roomService';
import {useChatStore} from '~/stores/zustand/chat.store';
import {SocketProvider, useSocket} from '~/socket/SocketProvider';
import UModal, {UModalRef} from '~/components/Common/modal/UModal';
import BottomSheetComponent from './components/bottomSheet/__index';
import ReplyMessageComponent, {
  ReplyMessageRef,
} from './components/bottomSheet/ReplyMessage';
import StatusChat from './components/bottomSheet/StatusChat';
import MessageListView from './components/listMessages';
import RoomRepository from '~/database/repositories/RoomRepository';
import {database} from '~/database';
import {Room} from '~/features/room/dto/room.dto.nested';
import {useRoomStore} from '~/stores/zustand/room.store';
import {useStateStore} from '~/stores/zustand/state.store';

export type DisplayMessage = _MessageSentRes & {
  isDisplayTime?: boolean;
  isDisplayHeart?: boolean;
  isDisplayAvatar?: boolean;
  isDisplayStatus?: boolean;
  messageStatus: MessageViewStatus;
};
const ChatScreen: React.FC = () => {
  const mainNav = useNavigation<MainNavProp>();

  const {curentMessageRepling, clearData} = useChatStore();
  const {currentRoomId, currentPartnerId, resetCurrentRoomId} = useRoomStore();
  const [room, setRoom] = useState<Room>();
  const {emit} = useSocket();

  const modalRef = useRef<UModalRef>(null);
  const replyingRef = useRef<ReplyMessageRef>(null);
  const messageSelectedRef = useRef<_MessageSentRes>();
  const currenMessageReplyingRef = useRef<any>(curentMessageRepling);
  const inputText = useRef('');

  useEffect(() => {
    emit('join-room', {roomId: currentRoomId});
    
    const setData = async (): Promise<void> => {
      try {
        let roomIdTemp: any;
        if (currentRoomId) {
          roomIdTemp = currentRoomId;
        } else {
          if (currentPartnerId) {
            const res = await RoomService.findOneByPartnerId(currentPartnerId);
            setRoom(res);
            resetCurrentRoomId(res.id);
            roomIdTemp = res.id;
          }
        }
      } catch (error: any) {}
    };
    setData();

    return () => {
      clearData();
      emit('leave-room', {roomId: currentRoomId});
    };
  }, []);

  useEffect(() => {
    const reply = currenMessageReplyingRef.current;
    if (currenMessageReplyingRef.current) {
      replyingRef.current?.show(
        reply?.sender?.user.username ?? 'Unknown',
        reply?.content ?? '',
      );
    }
  }, []);

  //vào room reset lại unread
  useEffect(() => {
    const roomRepo = new RoomRepository();
    if (currentRoomId) roomRepo.resetRoomUnreadCount(currentRoomId);
  }, []);

  const handleInputChange = useCallback((text: string) => {
    inputText.current = text;
  }, []);
  const handleEmojiChange = useCallback((text: string) => {
    inputText.current += text;
  }, []);

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

        <MessageListView />

        <StatusChat isGroup= {room?.memberCount != 2} />

        <ReplyMessageComponent ref={replyingRef} />

        <BottomSheetComponent
          roomId={currentRoomId ?? ''}
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
});

export default ChatScreen;
