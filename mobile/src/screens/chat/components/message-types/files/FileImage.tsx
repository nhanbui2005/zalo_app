import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Assets } from '~/styles/Ui/assets';
import { iconSize } from '~/styles/Ui/icons';
import { textStyle } from '~/styles/Ui/text';

const FileImage = ({ media, onPress }) => {
  // Tính toán kích thước ảnh dựa trên màn hình
  
  const screenWidth = Dimensions.get('window').width;
  const maxWidth = Math.min(screenWidth * 0.8, 260);
  const imageSize = {
    width: maxWidth,
    height: maxWidth,
  };

  // Format size từ bytes sang KB
  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  // Lấy tên file từ đường dẫn
  const getFileName = (path: string) => {
    if (!path) return 'Image';
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.9}
      style={styles.touchable}
    >
      <View style={[styles.container, imageSize]}>
        <FastImage
          source={{ uri: media.localPath || media.url }}
          style={[styles.image, imageSize]}
          resizeMode={FastImage.resizeMode.cover}
        />
        {/* Overlay thông tin ở dưới */}
        <View style={styles.infoOverlay}>
          <View style={styles.infoContent}>
            <Image 
              source={Assets.icons.image} 
              style={[iconSize.medium, iconSize.mediumLarge]}
            />
            <View style={styles.textContainer}>
              <Text numberOfLines={1} style={styles.fileName}>
                {getFileName(media.localPath || media.url)}
              </Text>
              <Text style={styles.fileSize}>
                {formatSize(media.bytes)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    alignSelf: 'flex-start',
  },
  container: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden', // Quan trọng để giữ border radius cho overlay
    position: 'relative',
  },
  image: {
    borderRadius: 12,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Nền tối trong suốt
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10

  },
  icon: {
    tintColor: '#fff', // Icon màu trắng
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  fileName: {
    ...textStyle.body_sm,
    color: '#fff',
    marginBottom: 2,
  },
  fileSize: {
    ...textStyle.body_xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default FileImage;
