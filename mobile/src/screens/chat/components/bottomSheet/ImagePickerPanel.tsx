import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import {Assets} from '~/styles/Ui/assets';
import {colors} from '~/styles/Ui/colors';
import {iconSize} from '~/styles/Ui/icons';
import {textStyle} from '~/styles/Ui/text';
import * as ImagePicker from 'react-native-image-picker';
import { _MessageSentReq } from '~/features/message/dto/message.dto.parent';
import { useChatStore } from '~/stores/zustand/chat.store';
interface ImagePickerPanelProps {
  onClose: () => void;
  inputRef: React.RefObject<any>;
  handleAnimation: (text: string) => void;
}

interface ImageItem {
  uri: string;
  fileName: string;
  type: string;
  selected: boolean;
}

const ImagePickerPanel: React.FC<ImagePickerPanelProps> = ({
  onClose,
  inputRef,
  handleAnimation,
}) => {
  const { images, setImages } = useChatStore(); // Lấy từ store
  const [loading, setLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  const loadImages = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 0,
        includeBase64: false,
      });

      if (result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri || '',
          fileName: asset.fileName || '',
          type: asset.type || '',
          selected: false,
          with: asset.width || 0,
          height: asset.height || 0
        }));
        setImages(newImages); // Cập nhật store
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const toggleImageSelection = (index: number) => {
    const updatedImages = [...images];
    updatedImages[index].selected = !updatedImages[index].selected;
    setImages(updatedImages); // Cập nhật store

    const newSelectedCount = updatedImages.filter(img => img.selected).length;
    setSelectedCount(newSelectedCount);

    if (newSelectedCount > 0) {
      handleAnimation('text');
    } else {
      handleAnimation('');
    }
  };

  const renderImageItem = ({ item, index }: { item: ImageItem; index: number }) => {
    return (
      <TouchableOpacity
        style={styles.imageItem}
        onPress={() => toggleImageSelection(index)}
      >
        <Image source={{ uri: item.uri }} style={styles.image} />
        {item.selected && (
          <View style={styles.checkmarkContainer}>
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.imagePickerContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            onClose();
            Keyboard.dismiss();
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }}
        >
          <Image source={Assets.icons.back_gray} style={iconSize.medium} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Chọn ảnh</Text>
          <Text style={styles.subtitle}>{selectedCount} ảnh đã chọn</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
          contentContainerStyle={styles.imageList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imagePickerContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray_light,
  },
  closeButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 16,
  },
  title: {
    ...textStyle.titleText,
    fontSize: 18,
  },
  subtitle: {
    ...textStyle.body_sm,
    color: colors.gray,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  imageList: {
    padding: 4,
  },
  imageItem: {
    width: (Dimensions.get('window').width - 32) / 3,
    height: (Dimensions.get('window').width - 32) / 3,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImagePickerPanel; 