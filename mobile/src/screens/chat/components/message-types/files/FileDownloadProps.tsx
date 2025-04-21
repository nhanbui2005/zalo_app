import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Assets } from '~/styles/Ui/assets';
import { colors } from '~/styles/Ui/colors';
import { textStyle } from '~/styles/Ui/text';
import { iconSize } from '~/styles/Ui/icons';

interface FileDownloadProps {
  fileName: string;
  fileSize: number;
  progress?: number;
  onRetry?: () => void;
}

const FileDownload: React.FC<FileDownloadProps> = ({
  fileName,
  fileSize,
  progress = 0,
  onRetry
}) => {
  // Format size từ bytes sang KB
  const formatSize = (bytes: number) => {
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  return (
    <View style={styles.container}>
      {/* Icon và thông tin file */}
      <View style={styles.fileInfo}>
        <View style={styles.iconContainer}>
          <Image 
            source={Assets.icons.alam} 
            style={[iconSize.medium, styles.fileIcon]} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={styles.fileSize}>
            {formatSize(fileSize)}
          </Text>
          <Text style={styles.uploadStatus}>
            Đang gửi {progress}%
          </Text>
        </View>
      </View>

      {/* Thanh tiến trình */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar,
            { width: `${progress}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    width: 240,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.gray_light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileIcon: {
    tintColor: colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  fileName: {
    ...textStyle.body_sm,
    color: colors.black,
    marginBottom: 2,
  },
  fileSize: {
    ...textStyle.body_xs,
    color: colors.gray_icon,
    marginBottom: 2,
  },
  uploadStatus: {
    ...textStyle.body_xs,
    color: colors.primary,
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: colors.gray_light,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1,
  }
});

export default FileDownload;
