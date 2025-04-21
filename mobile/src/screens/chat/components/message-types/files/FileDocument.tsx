import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '~/styles/Ui/colors';
import { Assets } from '~/styles/Ui/assets';
import { formatFileSize } from '~/utils/formatUtils';

const FileDocument: React.FC<{ media: any }> = ({ media }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Image source={Assets.icons.bell_white} style={styles.icon} />
      </View>
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>
          {media.originalName || 'Document'}
        </Text>
        <Text style={styles.fileSize}>
          {media.bytes ? formatFileSize(media.bytes) : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.downloadButton}>
        <Image source={Assets.icons.bell_white} style={styles.downloadIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.secondary_bright,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: colors.primary,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    color: colors.black,
  },
  fileSize: {
    fontSize: 12,
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

export default FileDocument;


