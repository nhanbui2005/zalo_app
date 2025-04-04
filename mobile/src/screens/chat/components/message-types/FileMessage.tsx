import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Assets } from '~/styles/Ui/assets';
import { colors } from '~/styles/Ui/colors';
import { textStyle } from '~/styles/Ui/text';
import { formatFileSize } from '~/utils/formatUtils';
import { MediaService } from '~/services/MediaService';

type FileMessageProps = {
  media?: {
    _id: string;
    name: string;
    size?: number;
  };
};

const FileMessage: React.FC<FileMessageProps> = ({ media }) => {
  const handleDownload = () => {
    if (media?._id) {
      MediaService.getInstance().retryDownload(media._id);
    }
  };

  return (
    <View style={styles.fileContainer}>
      <View style={styles.fileIconContainer}>
        <Image source={Assets.icons.mess_blue} style={styles.fileIcon} />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {media?.name || 'File'}
        </Text>
        <Text style={styles.fileSize}>
          {media?.size ? formatFileSize(media.size) : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
        <Image source={Assets.icons.mess_blue} style={styles.downloadIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default FileMessage; 