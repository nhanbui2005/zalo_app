import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {colors} from '../../../styles/Ui/colors';
import {imagesStyle} from '../../../styles/Ui/image';
import {Assets} from '../../../styles/Ui/assets';
import {iconSize} from '../../../styles/Ui/icons';
import {textStyle} from '../../../styles/Ui/text';
import AnimatedEmojis from './AnimatedEmojis';
import { MessageViewStatus } from '~/features/message/dto/message.enum';

type SourceMessageType = 'time' | 'action' | 'me' | 'people';
type MessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'video'
  | 'location'
  | 'call_send'
  | 'call_receive'
  | 'call_missed'
  | 'video_send'
  | 'video_receive'
  | 'video_missed';

interface Message {
  id: string;
  data: string;
  status: MessageViewStatus,
  source?: boolean;
  type: MessageType;
  time?: string;
  emojis?: string[];
  emojisCount?: number;
}
type DisplayMessage = Message & {
  isDisplayTime?: boolean;
  isDisplayHeart?: boolean;
  isDisplayAvatar?: boolean;
  isDisplayStatus?: boolean;
};
const getUniqueId = () => {
  return Math.floor(Math.random() * Date.now()).toString();
};
const ItemMessage: React.FC<DisplayMessage> = ({
  data,
  source,
  type,
  time,
  status,
  emojis,
  isDisplayTime,
  isDisplayHeart,
  isDisplayAvatar,
  isDisplayStatus,
}) => {
  // Logic containerStyle và textstyle
  let containerStyle = {};
  let textStyles = {};
  switch (source) {
    // case 'time':
    //   containerStyle = styles.timeContainer;
    //   textStyles = styles.timeText;
    //   break;
    // case 'action':
    //   containerStyle = styles.actionContainer;
    //   textStyles = styles.actionText;
    //   break;
    case true:
      containerStyle = styles.meContainer;
      textStyles = styles.meText;

      break;
    case false:
      containerStyle = styles.peopleContainer;
      textStyles = styles.peopleText;

      break;
    default:
      break;
  }

  const [emojisAnimated, setEmojisAnimated] = useState<
    {id: string; emoji: string}[]
  >([]);
  const [threeEmojis, setThreeEmojis] = useState<string[]>([]);
  const [emojiCount, setEmojiCount] = useState(0);
  const emojisCountAnimatedValue = useRef(new Animated.Value(0)).current;
  const emojiTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (emojis && emojis.length > 0) {
      const slicedEmojis = emojis
        .slice(-3)
        .map(emoji => emoji.slice(emoji.indexOf('_') + 1));
      setThreeEmojis(slicedEmojis);
    }
  }, []);

  const handleEmojiPress = (emoji: string) => {
    setEmojiCount(prevCount => prevCount + 1);

    setEmojisAnimated(prevEmojis => [
      ...prevEmojis,
      {id: getUniqueId(), emoji: emoji},
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
    setEmojisAnimated(oldEmoji =>
      [...oldEmoji].filter(emoji => emoji.id !== id),
    );
  }, []);

  const renderMessageByType = (type: MessageType, data: string) => {
    switch (type) {
      case 'text':
        return <Text style={styles.messageText}>{data}</Text>;
      case 'image':
        return (
          <Image
            source={Assets.images.demo}
            style={{width: 100, height: 100}}
          />
        );
      case 'file':
        return <Text>Hiển thị tệp đính kèm</Text>;
      case 'video':
        return <Text>Hiển thị video</Text>;
      case 'location':
        return <Text>Hiển thị vị trí</Text>;
      case 'call_send':
        return <Text>Cuộc gọi đã gửi</Text>;
      case 'call_receive':
        return <Text>Cuộc gọi đến</Text>;
      case 'call_missed':
        return <Text>Cuộc gọi nhỡ</Text>;
      case 'video_send':
        return <Text>Video đã gửi</Text>;
      case 'video_receive':
        return <Text>Video đến</Text>;
      case 'video_missed':
        return <Text>Video nhỡ</Text>;
      default:
        return <Text>Loại tin nhắn không xác định</Text>;
    }
  };

  return (
    <View>
      <View
        style={[
          containerStyle,
          styles.messageContainer,
          emojis && emojis.length > 0 && {marginBottom: 30},
        ]}>
        <View
          style={{flexDirection: 'row', alignItems: 'center', width: '100%'}}>
          {/* Avatar */}
          { isDisplayAvatar && (
            <Image style={styles.avatar} source={Assets.images.demo} />
          )}
          <View style={styles.textContainer}>
            {/* Nội dung tin nhắn */}
            {renderMessageByType(type, data)}
            {/* time */}
            {/* {isDisplayTime && ( */}
            <Text
              style={[
                textStyle.body_xs,
                {
                  // color: source === 'time' ? colors.white : colors.gray,
                },
              ]}>
              {time}
            </Text>
            {/* )} */}
            {/* Hiển thị emoji */}
            <TouchableOpacity
              onPress={() => {
                if (emojis && emojis.length > 0) {
                  const lastEmoji = emojis[emojis.length - 1];
                  handleEmojiPress(lastEmoji.split('_')[1]);
                } else {
                  handleEmojiPress('❤️');
                }
              }}>
              {emojis && emojis.length > 0 ? (
                <Text style={[styles.emoji, {fontSize: 11}]}>
                  {emojis[emojis.length - 1].split('_')[1]}
                </Text>
              ) : (
                isDisplayHeart && (
                  <View style={styles.emoji}>
                    {emojiCount > 0 ? (
                      <Text style={[{fontSize: 11}]}>❤️</Text>
                    ) : (
                      <Image
                        style={iconSize.small}
                        source={Assets.icons.heart_gray}
                      />
                    )}
                  </View>
                )
              )}
            </TouchableOpacity>

            {/* Hiển thị danh sách emoji */}
            {emojis && emojis.length > 0 && (
              <>
                <Pressable style={styles.emojis}>
                  {threeEmojis.map((emoji, index) => (
                    <Text key={index}>{emoji}</Text>
                  ))}
                </Pressable>
              </>
            )}

            {/* count */}
            {(emojis && emojis.length > 0) || isDisplayHeart ? (
              <Animated.View
                style={[
                  styles.countContainer,
                  {
                    transform: [
                      {translateY: emojisCountAnimatedValue},
                      {
                        scale: emojisCountAnimatedValue.interpolate({
                          inputRange: [-80, 0],
                          outputRange: [1, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                <Text style={[textStyle.titleText, {fontSize: 10}]}>
                  {emojiCount}
                </Text>
              </Animated.View>
            ) : null}

            {emojisAnimated.map(emoji => (
              <AnimatedEmojis
                key={emoji.id}
                id={emoji.id}
                emoji={emoji.emoji}
                onCompleteAnimation={handleAnimationComplete}
              />
            ))}
          </View>
          {/* status message */}
        </View>
      </View>
      {isDisplayStatus &&  <View style={{ alignSelf: "flex-end" }}><Text style={styles.status}> {`✓ ${StatusString[status]}`}</Text></View>}
    </View>
  );
};

const StatusString = {
  'sending':'Đang gửi',
  'sent':'Đã gửi',
  'received':'Đã nhận',
}

const styles = StyleSheet.create({
  messageContainer: {
    borderRadius: 10,
    paddingHorizontal: 8,
    marginBottom: `2%`,
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
  messageText: {
    ...textStyle.body_md,
    textAlign: 'left',
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
    height: 20,
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
    backgroundColor: colors.primary_light,
    justifyContent: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 8,
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
    paddingHorizontal: 6,
    borderRadius: 40,
    textAlign: 'center',
    backgroundColor: colors.gray,
    color: 'white',
  },
});

export default ItemMessage;
