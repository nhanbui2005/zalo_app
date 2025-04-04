import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Assets } from '~/styles/Ui/assets';
import { colors } from '~/styles/Ui/colors';
import { textStyle } from '~/styles/Ui/text';
import { formatDuration } from '~/utils/formatUtils';
import { MediaService } from '~/services/MediaService';

type VideoMessageProps = {
  media?: {
    _id: string;
    name: string;
    duration?: number;
    preview_image?: string;
  };
};

const VideoMessage: React.FC<VideoMessageProps> = ({ media }) => {
  const handlePlay = () => {
    if (media?._id) {
      MediaService.getInstance().retryDownload(media._id);
    }
  };

  return (
    <View style={styles.videoContainer}>
      {media?.preview_image ? (
        <Image 
          source={{ uri: media.preview_image }}
          style={styles.videoThumbnail}
        />
      ) : (
        <View style={styles.videoPlaceholder}>
          <Image 
            source={Assets.icons.mess_blue}
            style={styles.videoIcon}
          />
        </View>
      )}
      <View style={styles.videoInfo}>
        <Text style={styles.videoName} numberOfLines={1}>
          {media?.name || 'Video'}
        </Text>
        <Text style={styles.videoDuration}>
          {media?.duration ? formatDuration(media.duration) : ''}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.playButton}
        onPress={handlePlay}
      >
        <Image 
          source={Assets.icons.mess_blue}
          style={styles.playIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default VideoMessage; 