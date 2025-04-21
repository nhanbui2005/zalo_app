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
import {useSocket} from '~/socket/SocketProvider';
import {useChatStore} from '~/stores/zustand/chat.store';
import {_MessageSentReq} from '~/features/message/dto/message.dto.parent';
import {useAppSelector} from '~/stores/redux/store';
import {appSelector} from '~/features/app/appSlice';
import MemberRepository from '~/database/repositories/MemberRepository';
import { MMKVStore } from '~/utils/storage';
import MenuList from './Menulist';
import ImagePickerPanel from './ImagePickerPanel';
import VoiceRecorder from './voice/VoiceRecorder';

interface BottomSheetProps {
  roomId: string;
  onTextChange: (text: string) => void;
  onEmojiChange: (text: string) => void;
}
type ActiveComponent = 'keyboard' | 'emojis' | 'menu' | 'mic' | 'image' | null;

const BottomSheetComponent: React.FC<BottomSheetProps> = memo(
  ({roomId, onTextChange, onEmojiChange}) => {
    const inputRef = useRef<TextInput>(null);
    const currentMemberMyId = MMKVStore.getCurrentMemberMeId();
    const currentRoomId = MMKVStore.getCurrentRoomId();
    const {emit} = useSocket();
    const {meData} = useAppSelector(appSelector);
    const {sendMessage} = useChatStore()
    const {curentMessageRepling, setCurentMessageRepling} = useChatStore();
    const [text, setText] = useState('');
    const [keyboard, setKeyboard] = useState(false);
    const [activeComponent, setActiveComponent] = useState<ActiveComponent>(null);
    const [isWriting, setIsWriting] = useState(false);
    const scaleIcons = useRef(new Animated.Value(1)).current;
    const scaleSend = useRef(new Animated.Value(0)).current;


    useEffect(() => {
      if (!currentMemberMyId && meData) {
        const getMemberId = async () => {
          try {
            const memberRepo = MemberRepository.getInstance();
            const id = await memberRepo.getMemberMeId(currentRoomId, meData?.id);
            
            if (id) {
              MMKVStore.setCurrentMemberMeId(id);
            }
          } catch (error) {
            console.error("Lỗi khi lấy memberId:", error);
          }
        };
    
        getMemberId(); 
      }
    }, []); 
    
    //listen to emit writing
    useEffect(() => {
      if (text && !isWriting) {
        emit('writing-message', {
          roomId: roomId,
          memberId: currentMemberMyId,
          userName: meData?.username,
          status: true,
        });

        setIsWriting(true);
      } else if (text == '' && isWriting) {
        emit('writing-message', {
          roomId: roomId,
          memberId: currentMemberMyId,
          userName: meData?.username,
          status: false,
        });
        setIsWriting(false);
      }
    }, [text]);

    //listen state keyboard
    useEffect(() => {
      const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboard(true);
        setActiveComponent(null)
      });

      const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboard(false);
      });

      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }, []);

    const handleIconPress = useCallback((icon : ActiveComponent) => {
      if (activeComponent == icon) {
        setActiveComponent(null)
      }else {
        setActiveComponent(icon)
        Keyboard.dismiss();
      }
    }, [keyboard]);

    const renderComponent = () => {      
      switch (activeComponent) {
        case 'emojis':
          return <EmojiList onEmojisTextChange={handleEmojiChange} />;
        case 'menu':
          return <MenuList/>;
        case 'mic':
          return <VoiceRecorder/>;
        case 'image':
          return (
            <ImagePickerPanel
              onClose={() => {
                setActiveComponent(null);
                handleAnimation('');
              }}
              inputRef={inputRef}
              handleAnimation={handleAnimation}
            />
          );
        default:
          return null;
      }
    };

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
      if (roomId && meData) {
        setText('');
        handleAnimation('');
        setActiveComponent(null);
        setCurentMessageRepling(null);
        await sendMessage(roomId, currentMemberMyId, text); 
      }
    };

    return (
      <View>
        {curentMessageRepling && (
          <View style={styles.replyContainer}>
            <View style={styles.replyContent}>
              <Text style={styles.replyTitle}>
                Trả lời {curentMessageRepling.sender.username}
              </Text>
              <Text numberOfLines={1} style={styles.replyText}>
                {curentMessageRepling.content}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.closeReplyButton}
              onPress={() => setCurentMessageRepling(null)}
            >
              <Image source={Assets.icons.back_gray} style={[iconSize.small, { transform: [{ rotate: '45deg' }] }]} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.iconButton} onPress={()=>handleIconPress('emojis')}>
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
                styles.btns,
                {transform: [{scale: scaleIcons}], opacity: scaleIcons},
              ]}>
              <TouchableOpacity onPress={()=>handleIconPress('menu')} style={styles.iconButton}>
                <Image
                  source={Assets.icons.menu_row_gray}
                  style={iconSize.large}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>handleIconPress('mic')} style={styles.iconButton}>
                <Image source={Assets.icons.mic_gray} style={iconSize.large} />
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>handleIconPress('image')} style={styles.iconButton}>
                <Image
                  source={Assets.icons.image_gray}
                  style={iconSize.large}
                />
              </TouchableOpacity>
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

          </View>
        </View>

        {activeComponent && !keyboard && (
          <View style={{height: 294}}>
            {renderComponent()}
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
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray_light,
  },
  replyContent: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: 8,
  },
  replyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  replyText: {
    fontSize: 14,
    color: colors.gray,
  },
  closeReplyButton: {
    padding: 8,
  },
});

export default BottomSheetComponent;
