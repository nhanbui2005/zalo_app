import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {colors} from '../../../styles/Ui/colors';
import {imagesStyle} from '../../../styles/Ui/image';
import {Assets} from '../../../styles/Ui/assets';
import {iconSize} from '../../../styles/Ui/icons';
import {textStyle} from '../../../styles/Ui/text';
import AnimatedEmojis from './bottomSheet/AnimatedEmojis';
import { MessageContentType, MessageViewStatus } from '~/features/message/dto/message.enum';
import { _MessageSentReq, _MessageSentRes } from '~/features/message/dto/message.dto.parent';
import { Fonts } from '~/styles/Ui/fonts';
import { MessageItemDisplay } from '~/database/types/message.type';
import { useRoomStore } from '~/stores/zustand/room.store';
import ImageMessage from './ImageMessage';
import { formatFileSize, formatDuration } from '~/utils/formatUtils';
import { MediaService } from '~/services/MediaService';
import FileMessage from './message-types/FileMessage';
import VideoMessage from './message-types/VideoMessage';

// Định nghĩa Props cho ItemMessage
type Props = {
  message: MessageItemDisplay & {
    media?: {
      _id: string;
      name: string;
      size?: number;
      duration?: number;
      preview_image?: string;
    };
  };
  onLongPress?: (pageY: number) => void;
};

// Object ánh xạ trạng thái tin nhắn
const StatusString: any = {
  [MessageViewStatus.SENT]: 'Đã gửi',
  [MessageViewStatus.SENDING]: 'Đang gủi',
  [MessageViewStatus.RECEIVED]: 'Đã nhận',
  [MessageViewStatus.VIEWED]: 'Đã xem',
};

const getUniqueId = () => {
  return Math.floor(Math.random() * Date.now()).toString();
};

const ItemMessage: React.FC<Props> = React.memo(({ message, onLongPress }) => {
  // Destructure các thuộc tính từ message
  const {
    id,
    content,
    status,
    replyMessageId,
    source,
    sender,
    type, 
    emojis,
    createdAt,
    isSelfSent,
    isDisplayTime,
    isDisplayHeart,
    isDisplayAvatar,
    isDisplayStatus,
  } = message;

  const {currentRoom} = useRoomStore()
  const containerStyle = source == 'system' ? styles.systemContainer : 
  (isSelfSent ? styles.meContainer : styles.peopleContainer);

  const messageSystemAccetp = (message.content && !message.senderId)

  const textStyles = isSelfSent ? styles.meText : styles.peopleText;

  const [emojisAnimated, setEmojisAnimated] = useState<
    { id: string; emoji: string }[]
  >([]);
  const [emojiCount, setEmojiCount] = useState(0);
  const emojisCountAnimatedValue = useRef(new Animated.Value(0)).current;
  const emojiTimeout = useRef<ReturnType<typeof setTimeout>>();
  const itemRef = useRef<View>(null);

  const handleEmojiPress = (emoji: string) => {
    setEmojiCount((prevCount) => prevCount + 1);

    setEmojisAnimated((prevEmojis) => [
      ...prevEmojis,
      { id: getUniqueId(), emoji: emoji },
    ]);

    if (emojiTimeout.current) {
      clearTimeout(emojiTimeout.current);
    }

    emojiTimeout.current = setTimeout(() => {
      Animated.spring(emojisCountAnimatedValue, {
        toValue: 0,
        speed: 48,
        useNativeDriver: true,
      }).start();
    }, 500);

    Animated.spring(emojisCountAnimatedValue, {
      toValue: -80,
      speed: 48,
      useNativeDriver: true,
    }).start();
  };

  const handleAnimationComplete = useCallback((id: string) => {
    setEmojisAnimated((oldEmoji) =>
      [...oldEmoji].filter((emoji) => emoji.id !== id)
    );
  }, []);

  const handleLongPress = () => {
    if (itemRef.current) {
      itemRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (onLongPress) {
          onLongPress(pageY);
        }
      });
    }
  };

  const renderMessageByType = (type: MessageContentType, content: string) => {
    switch (type) {
      case 'text':
        return <Text style={styles.messageText}>{content}</Text>;
      case 'image':
        return <ImageMessage message={message} />;
      case 'file':
        return <FileMessage media={message.media} />;
      case 'video':
        return <VideoMessage media={message.media} />;
      default:
        return <Text>Loại tin nhắn không xác định</Text>;
    }
  };

  // Giả định replyMessage (nếu có replyMessageId, cần lấy dữ liệu từ đâu đó)
  const replyMessage = replyMessageId
    ? { id: replyMessageId, content: 'Reply content', sender: { user: { username: 'User' } } }
    : undefined;
    
  return (
    <>
     {messageSystemAccetp ? 
      <View style = {[styles.messageAccepct, styles.systemContainer]}>
        <Image style = {imagesStyle.avatar_small} source={{uri: currentRoom?.roomAvatar}}/>
        <Text style={textStyle.body_sm}>{currentRoom?.roomName} { message.content}</Text>
      </View>
      : 
      <Pressable key={id} ref={itemRef} onLongPress={handleLongPress}>
      <View
        style={[
          containerStyle,
          styles.messageContainer,
          emojis && emojis?.length > 0 && { marginBottom: 30 },
        ]}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
        >
          {/* Avatar */}
          {isDisplayAvatar && (
            <Image
              style={styles.avatar}
              source={
                sender?.avatarUrl
                  ? { uri: sender.avatarUrl }
                  : Assets.images.demo
              }
            />
          )}
          <View style={styles.textContainer}>
            {replyMessage && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View
                  style={{
                    backgroundColor: colors.secondary_bright,
                    width: 3,
                    height: '100%',
                    borderRadius: 10,
                  }}
                />
                <View>
                  <Text
                    style={[
                      textStyle.body_sm,
                      {
                        padding: 0,
                        fontFamily: Fonts.proximaNova.regular,
                        fontWeight: 'bold',
                      },
                    ]}
                  >
                    {replyMessage.sender.user.username}
                  </Text>
                  <Text
                    style={[textStyle.body_sm, { color: colors.gray_icon }]}
                  >
                    {replyMessage.content}
                  </Text>
                </View>
              </View>
            )}
            {/* Nội dung tin nhắn */}
            {renderMessageByType(type, content)}
            {/* Time */}
            {isDisplayTime && (
              <Text
                style={[
                  textStyle.body_xs,
                  {
                    // color: source === 'time' ? colors.white : colors.gray,
                  },
                ]}
              >
                {createdAt
                  ? new Date(createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </Text>
            )}
            {/* Hiển thị emoji */}
            <Pressable
              onPress={() => {
                if (emojis && emojis.length > 0) {
                  const lastEmoji = emojis[emojis.length - 1];
                  handleEmojiPress(lastEmoji.split('_')[1]);
                } else {
                  handleEmojiPress('❤️');
                }
              }}
            >
              {emojis && emojis.length > 0 ? (
                <Text style={[styles.emoji, { fontSize: 11 }]}>
                  {emojis[emojis.length - 1].split('_')[1]}
                </Text>
              ) : (
                isDisplayHeart && (
                  <View style={styles.emoji}>
                    {emojiCount > 0 ? (
                      <Text style={[{ fontSize: 11 }]}>❤️</Text>
                    ) : (
                      <Image
                        style={iconSize.small}
                        source={Assets.icons.heart_gray}
                      />
                    )}
                  </View>
                )
              )}
            </Pressable>

            {/* Hiển thị danh sách emoji */}
            {emojis && emojis.length > 0 && (
              <Pressable style={styles.emojis}>
                {emojis.map((emoji, index) => (
                  <Text key={index}>{emoji}</Text>
                ))}
              </Pressable>
            )}

            {/* Count */}
            {(emojis && emojis.length > 0) || isDisplayHeart ? (
              <Animated.View
                style={[
                  styles.countContainer,
                  {
                    transform: [
                      { translateY: emojisCountAnimatedValue },
                      {
                        scale: emojisCountAnimatedValue.interpolate({
                          inputRange: [-80, 0],
                          outputRange: [1, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={[textStyle.titleText, { fontSize: 10 }]}>
                  {emojiCount}
                </Text>
              </Animated.View>
            ) : null}

            {emojisAnimated.map((emoji) => (
              <AnimatedEmojis
                key={emoji.id}
                id={emoji.id}
                emoji={emoji.emoji}
                onCompleteAnimation={handleAnimationComplete}
              />
            ))}
          </View>
        </View>
      </View>
      {isDisplayStatus && (
        <View style={{ alignSelf: 'flex-end' }}>
          <Text style={styles.status}>
            {`✓ ${StatusString[status]}`}
          </Text>
        </View>
      )}
     </Pressable>
     }
    </>
  );
});

const styles = StyleSheet.create({
  messageContainer: {
    borderRadius: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  countContainer: {
    position: 'absolute',
    right: -13,
    bottom: -24,
    borderRadius: 50,
    backgroundColor: '#FFB300',
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAccepct: {
    flexDirection: 'row',
    alignItems: 'center', 
    backgroundColor: colors.white, 
    padding: 8, 
    margin: 50,
    paddingHorizontal:10,
    gap: 8,
    borderRadius: 20,  
    maxWidth: '90%', 
    alignSelf: 'flex-start', 
  },
  messageText: {
    ...textStyle.body_md,
    textAlign: 'left',
    paddingVertical: 4
  },
  countText: {
    color: colors.white,
    fontSize: 10,
  },
  textContainer: {
    maxWidth: '80%',
    minWidth: '18%',
    justifyContent: 'flex-start',
    gap: 2,
  },
  timeContainer: {
    backgroundColor: colors.gray,
    height: 14,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  timeText: {
    textAlign: 'center',
    color: colors.white,
    fontSize: 8,
  },

  actionContainer: {
    backgroundColor: colors.white,
    height: 40,
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
  },
  actionText: {
    color: colors.black,
    fontSize: 10,
  },

  meContainer: {
    backgroundColor: colors.secondary_transparent,
    justifyContent: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  systemContainer: {
    backgroundColor: colors.white,
    alignSelf: 'center',
  },
  meText: {
    color: colors.black,
    fontSize: 13,
  },

  peopleContainer: {
    marginLeft: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  peopleText: {
    color: colors.black,
    fontSize: 13,
  },
  emoji: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    right: -10,
    bottom: -22,
    borderRadius: 50,
    padding: 3,
    borderColor: colors.gray_icon,
    borderWidth: 0.2,
    backgroundColor: colors.white,
    resizeMode: 'contain',
  },
  emojis: {
    gap: 2,
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    right: 22,
    bottom: -22,
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderColor: colors.gray_icon,
    borderWidth: 0.2,
    backgroundColor: colors.white,
    resizeMode: 'contain',
  },

  avatar: {
    ...imagesStyle.avatar_35,
    position: 'absolute',
    left: -50,
    top: -20,
  },
  status: {
    ...textStyle.description_seen,
    padding: 2,
    marginBottom: 14,
    paddingHorizontal: 6,
    borderRadius: 40,
    textAlign: 'center',
    backgroundColor: colors.gray,
    color: 'white',
  },

  // File styles
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.secondary_bright,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIcon: {
    width: 24,
    height: 24,
    tintColor: colors.primary,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    ...textStyle.body_sm,
    color: colors.black,
  },
  fileSize: {
    ...textStyle.body_xs,
    color: colors.gray_icon,
  },
  downloadButton: {
    padding: 8,
  },
  downloadIcon: {
    width: 20,
    height: 20,
    tintColor: colors.primary,
  },

  // Video styles
  videoContainer: {
    width: 240,
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 135,
    backgroundColor: colors.gray_icon,
  },
  videoPlaceholder: {
    width: '100%',
    height: 135,
    backgroundColor: colors.gray_icon,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    width: 40,
    height: 40,
    tintColor: colors.white,
  },
  videoInfo: {
    padding: 8,
  },
  videoName: {
    ...textStyle.body_sm,
    color: colors.black,
  },
  videoDuration: {
    ...textStyle.body_xs,
    color: colors.gray_icon,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 24,
    height: 24,
    tintColor: colors.white,
  },
});

export default ItemMessage;
