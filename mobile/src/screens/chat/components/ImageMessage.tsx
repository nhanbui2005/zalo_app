import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { colors } from '~/styles/Ui/colors';
import { MessageItemDisplay } from '~/database/types/message.type';

const { width } = Dimensions.get('window');
const MAX_WIDTH = width * 0.7;

interface ImageMessageProps {
  message: MessageItemDisplay;
}

const ImageMessage: React.FC<ImageMessageProps> = ({ message }) => {
  const { content, isSelfSent } = message;
  
  // Nếu content là một URL ảnh
  const imageUrl = content.startsWith('http') ? content : '';
  
  // Nếu content là một đường dẫn local
  const localImage = !content.startsWith('http') ? { uri: content } : null;
  
  return (
    <View style={[styles.container, isSelfSent ? styles.sentContainer : styles.receivedContainer]}>
      <Image
        source={localImage || { uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: MAX_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },
  sentContainer: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary_light,
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
});

export default ImageMessage; 