import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { textStyle } from '~/styles/Ui/text';
import { colors } from '~/styles/Ui/colors';
import useSocketEvent from '~/hooks/useSocket ';

interface Props {
  isGroup: boolean;
}

const StatusChat = ({ isGroup }: Props) => {
  const [typingUser, setTypingUser] = React.useState<string | null>(null);

  useSocketEvent<{ userName: string }>({
    event: 'writing_message',
    callback: (data) =>{
      console.log(data);
      
      setTypingUser(data.userName)
    },
  });

  const dot1 = useRef(new Animated.Value(1)).current;
  const dot2 = useRef(new Animated.Value(1)).current;
  const dot3 = useRef(new Animated.Value(1)).current;
  const animations: Animated.CompositeAnimation[] = [];

  useEffect(() => {
    if (!typingUser) {
      dot1.setValue(1);
      dot2.setValue(1);
      dot3.setValue(1);
      return;
    }

    // Hàm tạo animation
    const animateDot = (dot: Animated.Value, delay: number) => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 2, duration:550, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 1, duration: 550, useNativeDriver: true }),
        ])
      );

      setTimeout(() => anim.start(), delay);
      animations.push(anim);
    };

    // Reset lại animation nếu có người mới gõ
    animations.forEach((anim) => anim.stop());
    animations.length = 0;

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, [typingUser]);

  
  if (!typingUser) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {isGroup ? `${typingUser} đang soạn tin ` : 'Đang soạn tin '}
      </Text>
      <Animated.View style={[styles.dot, { transform: [{ scale: dot1 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ scale: dot2 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ scale: dot3 }] }]} />
    </View>
  );
};

export default StatusChat;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    position: 'absolute',
    bottom: 50,
  },
  text: {
    ...textStyle.body_sm,
    color: colors.secondary,
    marginRight: 4,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginHorizontal: 2,
  },
});
