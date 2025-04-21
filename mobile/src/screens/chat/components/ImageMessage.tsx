import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  FlatList,
} from 'react-native';
import { colors } from '~/styles/Ui/colors';
import { MessageItemDisplay } from '~/database/types/message.type';
import { MediaRes } from '~/features/message/dto/message.dto.parent';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_WIDTH = SCREEN_WIDTH * 0.7;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.5;

interface ImageMessageProps {
  message: MessageItemDisplay;
}

const ImageMessage: React.FC<ImageMessageProps> = React.memo(({ message }) => {
  const { isSelfSent, media, isDisplayTime, isDisplayAvatar, isDisplayStatus, isDisplayTimeBox, isDisplayHeart, sender, status, createdAt } = message;

  // State để lưu kích thước của từng hình ảnh
  const [imageSizes, setImageSizes] = useState<{ [key: string]: { width: number; height: number } }>({});

  // Lấy kích thước hình ảnh
  useEffect(() => {
    if (media && media.length > 0) {
      media.forEach((item) => {
        const uri = item.url || item.localPath;
        if (uri) {
          Image.getSize(
            uri,
            (width, height) => {
              const widthRatio = MAX_WIDTH / width;
              const heightRatio = MAX_HEIGHT / height;
              const scale = Math.min(widthRatio, heightRatio, 1);
              setImageSizes((prev) => ({
                ...prev,
                [uri]: {
                  width: width * scale,
                  height: height * scale,
                },
              }));
            },
            (error) => {
              console.error(`Failed to get size for image ${uri}:`, error);
              // Fallback kích thước mặc định nếu không lấy được
              setImageSizes((prev) => ({
                ...prev,
                [uri]: { width: 150, height: 150 },
              }));
            }
          );
        }
      });
    }
  }, [media]);

  // Render từng hình ảnh
  const renderImage = ({ item }: { item: MediaRes }) => {
    const uri = item.url || item.localPath;
    if (!uri) {
      return (
        <View style={[styles.placeholder, { width: 150, height: 150 }]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      );
    }

    const size = imageSizes[uri] || { width: 150, height: 150 };

    return (
      <Image
        source={{ uri: uri.trim() }}
        style={[styles.image, { width: size.width, height: size.height }]}
        resizeMode="cover"
        onError={() => console.log(`Failed to load image: ${uri}`)}
      />
    );
  };

  // Nếu không có media, không hiển thị
  if (!media || media.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        isSelfSent ? styles.sentContainer : styles.receivedContainer,
      ]}
    >
      {/* Hộp thời gian (nếu có) */}
      {isDisplayTimeBox && (
        <Text style={styles.timeBox}>
          {new Date(createdAt).toLocaleDateString()}
        </Text>
      )}

      <View style={styles.messageContent}>
        {/* Danh sách hình ảnh */}
        <FlatList
          data={media.filter((item) => item.type === 'image')} // Chỉ hiển thị media là hình ảnh
          renderItem={renderImage}
          keyExtractor={(item, index) => `${item.url || item.localPath}-${index}`}
          style={styles.imageList}
        />

        {/* Hiển thị thời gian (nếu có) */}
        {isDisplayTime && (
          <Text style={styles.time}>
            {new Date(createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}

        {/* Hiển thị trạng thái (nếu có) */}
        {isDisplayStatus && (
          <Text style={styles.status}>{status}</Text>
        )}

        {/* Hiển thị biểu tượng trái tim (nếu có) */}
        {isDisplayHeart && (
          <Text style={styles.heart}>❤️</Text>
        )}
      </View>

      {/* Hiển thị avatar (nếu có) */}
      {isDisplayAvatar && !isSelfSent && sender?.avatarUrl && (
        <Image
          source={{ uri: sender.avatarUrl }}
          style={styles.avatar}
          onError={() => console.log('Failed to load avatar')}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    maxWidth: MAX_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
  },
  messageContent: {
    flexDirection: 'column',
  },
  imageList: {
    borderRadius: 12,
  },
  image: {
    borderRadius: 12,
    marginBottom: 4,
  },
  placeholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 4,
  },
  placeholderText: {
    color: '#777',
    fontSize: 14,
  },
  timeBox: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  status: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  heart: {
    fontSize: 16,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 5,
    marginLeft: 10,
  },
});

export default ImageMessage;