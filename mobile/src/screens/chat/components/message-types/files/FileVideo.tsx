import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Text,
  Pressable,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { MainNavProp } from '~/routers/types';
import {Assets} from '~/styles/Ui/assets';
import {iconSize} from '~/styles/Ui/icons';
import {textStyle} from '~/styles/Ui/text';
import { WINDOW_WIDTH } from '~/utils/Ui/dimensions';

const FileVideo = ({media, onPress}) => {
  const mainNav = useNavigation<MainNavProp>();
  const screenWidth = WINDOW_WIDTH
  const maxWidth = Math.min(screenWidth * 0.8, 260);
  const imageSize = {
    width: maxWidth,
    height: maxWidth,
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  const getFileName = (path: string) => {
    if (!path) return 'Image';
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const handlePress = () => {
    mainNav.navigate('FullScreenVideo', {
      videoUrl: media.url || media.url,
    });
  };


  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.touchable}>
      <View style={[styles.container, imageSize]}>
        <FastImage
          source={{uri: media.localPath || media.url}}
          style={[styles.image, imageSize]}
          resizeMode={FastImage.resizeMode.cover}
        />

        {/* Nút play */}
        <Pressable onPress={handlePress} style={styles.playButtonContainer}>
          <Image source={Assets.icons.play} style={styles.playIcon} />
        </Pressable>

        <Text style={styles.fileDuration}>{formatDuration(media.duration)}</Text>

        {/* Overlay thông tin */}
        <View style={styles.infoOverlay}>
          <View style={styles.infoContent}>
            <Image
              source={Assets.icons.video}
              style={[iconSize.medium, iconSize.mediumLarge]}
            />
            <View style={styles.textContainer}>
              <Text numberOfLines={1} style={styles.fileName}>
                {getFileName(media.localPath || media.url)}
              </Text>
              <Text style={styles.fileSize}>{formatSize(media.bytes)}</Text>
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
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 12,
  },
  playButtonContainer: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    zIndex: 10,
  },
  playIcon: {
    width: 40,
    height: 40,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  fileDuration: {
    ...textStyle.body_xs,
    position: 'absolute',
    top: 10,
    left: 10,
    color: 'white',
    padding: 3,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});

export default FileVideo;
