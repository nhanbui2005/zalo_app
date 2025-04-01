import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableWithoutFeedback,
  StyleSheet,
  Keyboard,
  Text,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

// Định nghĩa kiểu cho thành phần hoạt động
type ActiveComponent = 'keyboard' | 'emojis' | 'menu' | 'mic' | 'image' | null;

const ChatInput: React.FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeComponent, setActiveComponent] = useState<ActiveComponent>(null);
  const inputMarginBottom = useSharedValue<number>(0);
  const snapPoints: number[] = [100, 300];
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    marginBottom: inputMarginBottom.value,
  }));

  const handleSheetChanges = (index: number) => {
    console.log('SnapPoints:', snapPoints);
    console.log('Current index:', index);
    if (index === 0) {
      inputMarginBottom.value = 0;
      setActiveComponent(null);
      Keyboard.dismiss();
    } else if (index === 1) {
      inputMarginBottom.value = 300;
    }
  };

  const handleCloseAll = () => {
    bottomSheetRef.current?.close();
    inputMarginBottom.value = 0;
    setActiveComponent(null);
    Keyboard.dismiss();
  };

  const openBottomSheet = (index: number) => {
    if (index >= 0 && index < snapPoints.length) {
      bottomSheetRef.current?.snapToIndex(index);
    } else {
      console.warn('Invalid snap index:', index);
    }
  };

  const renderComponent = (): JSX.Element | null => {
    switch (activeComponent) {
      case 'emojis':
        return (
          <View style={styles.component}>
            <Text>Emoji Panel</Text>
          </View>
        );
      case 'menu':
        return (
          <View style={styles.component}>
            <Text>Menu Panel</Text>
          </View>
        );
      case 'mic':
        return (
          <View style={styles.component}>
            <Text>Mic Panel</Text>
          </View>
        );
      case 'image':
        return (
          <View style={styles.component}>
            <Text>Image Panel</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleCloseAll}>
      <View style={styles.container}>
        <Animated.View style={[styles.inputContainer, inputAnimatedStyle]}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            onFocus={() => {
              setActiveComponent('keyboard');
              openBottomSheet(1);
            }}
          />
        </Animated.View>

        <BottomSheet
          ref={bottomSheetRef}
          index={0} // Ban đầu ẩn
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose={true}
        >
          {renderComponent()}
        </BottomSheet>

        <View style={styles.buttonContainer}>
          {(['emojis', 'menu', 'mic', 'image'] as const).map((type) => (
            <TouchableWithoutFeedback
              key={type}
              onPress={() => {
                setActiveComponent(type);
                openBottomSheet(1);
              }}
            >
              <View style={styles.button}>
                <Text>{type}</Text>
              </View>
            </TouchableWithoutFeedback>
          ))}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  inputContainer: {
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  component: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  button: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
  },
});

export default ChatInput;