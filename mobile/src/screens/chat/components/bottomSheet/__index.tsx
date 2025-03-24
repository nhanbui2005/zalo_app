import React, {memo, useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Animated,
  Keyboard,
  Text,
} from 'react-native';
import {Assets} from '~/styles/Ui/assets';
import {colors} from '~/styles/Ui/colors';
import {iconSize} from '~/styles/Ui/icons';
import EmojiList from './EmojiList';
import {useSelector} from 'react-redux';
import {appSelector} from '~/features/app/appSlice';
import {useSocket} from '~/socket/SocketProvider';
import {useChatStore} from '~/stores/zustand/chat.store';
import { _MessageSentReq } from '~/features/message/dto/message.dto.parent';
import MessageRepository from '~/database/repositories/MessageRepository';
import RoomRepository from '~/database/repositories/RoomRepository';
import { database } from '~/database';
import { MessageService } from '~/features/message/messageService';

interface BottomSheetProps {
  roomId: string,
  onTextChange: (text: string) => void;
  onEmojiChange: (text: string) => void;
}

const BottomSheetComponent: React.FC<BottomSheetProps> = memo(
  ({roomId, onTextChange, onEmojiChange}) => {
    const messageRepo = new MessageRepository()
    const roomRepo = new RoomRepository();
    const inputRef = useRef<TextInput>(null);
    const {emit} = useSocket();
    const { curentMessageRepling,memberWriting } = useChatStore();
    const [text, setText] = useState('');
    const [keyboard, setKeyboard] = useState(false);
    const [renderEmojis, setRenderEmojis] = useState(false);
    const [isWriting, setIsWriting] = useState(false);
    const scaleIcons = useRef(new Animated.Value(1)).current;
    const scaleSend = useRef(new Animated.Value(0)).current;

    //listen to emit writing
    useEffect(() => {      
      if (text && !isWriting) {
        emit('writing-message', {roomId: roomId, status: true});
        setIsWriting(true);
      } else if (text == '' && isWriting) {
        emit('writing-message', {roomId: roomId, status: false});
        setIsWriting(false);
      }
    }, [text]);

    //listen state keyboard
    useEffect(() => {
      const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboard(true);
        setRenderEmojis(false);
      });

      const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboard(false);
      });

      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }, []);

    const handleIconPress = useCallback(() => {
      if (!keyboard) {
        setRenderEmojis(prev => !prev);
      } else {
        Keyboard.dismiss();
        setRenderEmojis(true);
      }
    }, [keyboard]);

    const handleAnimation = useCallback((text: string) => {
      Animated.parallel([
        Animated.timing(scaleIcons, {
          toValue: text ? 0 : 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleSend, {
          toValue: text ? 1 : 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const handleEmojiChange = useCallback((emoji: string) => {
      setText(prev => prev + emoji);
      onEmojiChange(emoji);
    }, []);

    const handleTextChange = useCallback((newText: string) => {
      setText(newText);
      onTextChange(newText);
      handleAnimation(newText);
    }, []);
    const handleSendMessage = async () => {
      console.log(roomId);
      
      if (!roomId) return
      const dto = {
        roomId: roomId,
        content: text,
        contentType: curentMessageRepling?.id
      } as _MessageSentReq
      console.log(dto);
      
      await MessageService.SentMessage(dto, roomRepo, messageRepo)
      setText('');
    };

    return (
      <View>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.iconButton} onPress={handleIconPress}>
            <Image source={Assets.icons.ghost_gray} style={iconSize.large} />
          </TouchableOpacity>

          <View style={{flex: 1, flexDirection: 'row'}}>
            <Animated.View style={{flex: 1}}>
              <TextInput
                ref={inputRef}
                defaultValue={text}
                onChangeText={handleTextChange}
                placeholder="Tin nhắn"
                placeholderTextColor={colors.gray_icon}
                style={styles.input}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.btnSend,
                {transform: [{scale: scaleSend}], opacity: scaleSend},
              ]}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSendMessage}>
                <Image source={Assets.icons.send_blue} style={iconSize.large} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.btns,
                {transform: [{scale: scaleIcons}], opacity: scaleIcons},
              ]}>
              <TouchableOpacity style={styles.iconButton}>
                <Image
                  source={Assets.icons.menu_row_gray}
                  style={iconSize.large}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Image source={Assets.icons.mic_gray} style={iconSize.large} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Image
                  source={Assets.icons.image_gray}
                  style={iconSize.large}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {renderEmojis && !keyboard && (
          <View style={{height: 294}}>
            <EmojiList onEmojisTextChange={handleEmojiChange} />
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    alignItems: 'center',
    paddingRight: 40,
    marginHorizontal: 5,
  },
  btnSend: {
    position: 'absolute',
    right: 0,
    bottom: 5,
  },
  btns: {
    position: 'absolute',
    right: 0,
    bottom: 5,
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

export default BottomSheetComponent;
