import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import { MediaRes } from '~/features/message/dto/message.dto.parent';
import { MainNavProp, StackNames } from '~/routers/types';
import { Assets } from '~/styles/Ui/assets';
import { colors } from '~/styles/Ui/colors';
import { textStyle } from '~/styles/Ui/text';

interface FilePDFProps {
  media: MediaRes;
  onPress?: () => void;
}

const FilePDF: React.FC<FilePDFProps> = ({ media, onPress }) => {  
  const [downloading, setDownloading] = useState(false);
    const mainNav = useNavigation<MainNavProp>();
  
  const formatSize = (bytes: number = 0) => {
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const getFileName = () => {
    return media.originalName || 'Document.pdf';
  };

  const handleOpenPDF = async () => {
    mainNav.navigate(StackNames.PDFViewerScreen, {pdfUrl: media.url})
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handleOpenPDF}
      activeOpacity={0.8}
    >
      {/* Container cho cả thumbnail và overlay */}
      <View style={styles.imageContainer}>
        {/* Thumbnail */}
        {media.previewUrl && (
          <FastImage
            source={{ uri: media.previewUrl }}
            style={styles.thumbnail}
            resizeMode={FastImage.resizeMode.contain}
          />
        )}
        
        {/* Overlay gradient */}
        <View style={styles.overlay} />
      </View>

      {/* Thông tin đè lên phần dưới */}
      <View style={styles.infoContainer}>
        <Image 
          source={Assets.icons.pdf}
          style={styles.pdfIcon}
          resizeMode="contain"
        />
        <View style={styles.textContent}>
          <Text numberOfLines={1} style={styles.fileName}>
            {getFileName()}
          </Text>
          <View style={styles.detailsRow}>
            <Text style={styles.fileDetails}>
              PDF • {formatSize(media.bytes)}
              {downloading ? ' • Đang tải...' : ''}
            </Text>
            {media.id && (
              <View style={styles.downloadedContainer}>
                <Image 
                  source={Assets.icons.alam}
                  style={styles.checkIcon}
                  resizeMode="contain"
                />
                <Text style={styles.downloadedText}>Đã có trên máy</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 260,
    height: 180,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 0.8, 
    
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: colors.secondary_dark,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  pdfIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  textContent: {
    flex: 1,
  },
  fileName: {
    ...textStyle.body_sm,
    color: colors.white,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fileDetails: {
    ...textStyle.body_xs,
    color: colors.white,
  },
  downloadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkIcon: {
    width: 12,
    height: 12,
    tintColor: colors.white,
    marginRight: 4,
  },
  downloadedText: {
    ...textStyle.body_xs,
    color: colors.white,
  },
});

export default FilePDF;
