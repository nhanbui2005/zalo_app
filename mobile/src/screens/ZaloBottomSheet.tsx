import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Keyboard,
  Dimensions,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const App = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points tối thiểu
  const snapPoints = useMemo(() => [10], []); // Chiều cao tối thiểu 10px khi ẩn

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0); // Lưu chiều cao bàn phím
  const isIconListOpen = useSharedValue(0);

  // Lắng nghe sự kiện bàn phím
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height); // Lưu chiều cao bàn phím
      isIconListOpen.value = withTiming(0, { duration: 100 }); // Thu danh sách icon
      bottomSheetRef.current?.snapToPosition(10); // Giữ bottom sheet gần như ẩn
    });
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
      if (!isIconListOpen.value) {
        bottomSheetRef.current?.snapToPosition(10); // Thu về gần như ẩn
      }
    });

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Mở/đóng danh sách icon
  const toggleIconList = useCallback(() => {
    if (isKeyboardVisible) {
      // Thu bàn phím ngay lập tức và đảm bảo nó tắt trước khi mở danh sách
      Keyboard.dismiss();
      setKeyboardVisible(false); // Cập nhật trạng thái ngay để tránh chồng lấn
      setTimeout(() => {
        isIconListOpen.value = withTiming(1, { duration: 200 }); // Hiển thị danh sách icon
        bottomSheetRef.current?.snapToPosition(keyboardHeight); // Mở bottom sheet bằng chiều cao bàn phím
      }, 100); // Delay đủ để bàn phím thu hoàn toàn
    } else if (isIconListOpen.value) {
      isIconListOpen.value = withTiming(0, { duration: 200 }); // Thu danh sách icon
      bottomSheetRef.current?.snapToPosition(10); // Ẩn bottom sheet
    } else {
      isIconListOpen.value = withTiming(1, { duration: 200 });
      bottomSheetRef.current?.snapToPosition(keyboardHeight || SCREEN_HEIGHT * 0.35); // Dùng mặc định nếu chưa có
    }
  }, [isKeyboardVisible, keyboardHeight]);

  // Style động cho danh sách icon
  const iconListStyle = useAnimatedStyle(() => ({
    height: withTiming(isIconListOpen.value ? (keyboardHeight || SCREEN_HEIGHT * 0.35) : 0, { duration: 200 }),
    overflow: 'hidden',
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f0f0' }}>
      {/* View chứa input cố định, không bị đẩy bởi bàn phím */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 10,
          backgroundColor: '#fff',
          flexDirection: 'row',
          alignItems: 'center',
          zIndex: 1, // Đảm bảo input ở trên bottom sheet và bàn phím
        }}
      >
        <TextInput
          style={{
            flex: 1,
            height: 40,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 20,
            paddingHorizontal: 15,
            backgroundColor: '#fff',
          }}
          placeholder="Nhập tin nhắn..."
        />
        <TouchableOpacity
          style={{ padding: 10, marginLeft: 10 }}
          onPress={toggleIconList}
        >
          <Text style={{ fontSize: 20 }}>😊</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet cho danh sách icon */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0} // Bắt đầu gần như ẩn (10px)
        snapPoints={snapPoints}
        enablePanDownToClose={false} // Không cho kéo xuống đóng
        backgroundStyle={{ backgroundColor: '#fff' }}
        handleIndicatorStyle={{ backgroundColor: '#ccc' }}
        animationConfigs={{ duration: 200 }}
      >
        <BottomSheetView>
          {/* Danh sách icon */}
          <Animated.View style={iconListStyle}>
            <Text style={{ padding: 10 }}>Danh sách icon ở đây (emoji giống Zalo)...</Text>
          </Animated.View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default App;