import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Assets } from '~/styles/Ui/assets';
import { colors } from '~/styles/Ui/colors';
import { iconSize } from '~/styles/Ui/icons';
import { textStyle } from '~/styles/Ui/text';
import VoiceBottomSheet from './VoiceBottomSheet';
import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

const VoiceOrTextMessage = () => {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState('');
  const bottomSheetRef = useRef<BottomSheetMethods>(null);

  const handlePress = async () => {
    try {
      if (isRecording) {
        setTimeout(() => {
          bottomSheetRef.current?.snapToIndex(-1);
        }, 100);
      } else {
        if (!isRecording) {
          setIsRecording(true);
          setTimeout(() => {
            bottomSheetRef.current?.snapToIndex(0);
          }, 100);
        }
      }
    } catch (err) {
      console.log('Recording error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
       Bấm hoặc giữ để ghi âm
      </Text>

      {mode === 'voice' ? (
        <TouchableOpacity
          style={styles.micButton}
          onPress={handlePress}>
          <Image
            source={Assets.icons.birth_white}
            style={iconSize.large}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.micButton}
          onPress={handlePress}>
          <Image
            source={Assets.icons.contacts_primary}
            style={iconSize.large}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            mode === 'voice' ? styles.activeTab : styles.inactiveTab,
            styles.leftTab,
          ]}
          onPress={() => setMode('voice')}>
          <Text
            style={[
              styles.tabText,
              mode === 'voice' ? styles.activeText : styles.inactiveText,
            ]}>
            Gửi bản ghi âm
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            mode === 'text' ? styles.activeTab : styles.inactiveTab,
            styles.rightTab,
          ]}
          onPress={() => setMode('text')}>
          <Text
            style={[
              styles.tabText,
              mode === 'text' ? styles.activeText : styles.inactiveText,
            ]}>
            Gửi dạng văn bản
          </Text>
        </TouchableOpacity>
      </View>

      <VoiceBottomSheet ref={bottomSheetRef} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopColor: colors.gray_light,
    borderTopWidth: 0.6,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 40,
  },
  leftTab: {
    borderRadius: 20
  },
  rightTab: {
    borderRadius: 20

  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  inactiveTab: {
    backgroundColor: colors.gray_light, // màu xám nhạt
  },
  
  label: {
    ...textStyle.body_md,
    marginBottom: 20,
  },
  micButton: {
    backgroundColor: '#007AFF',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 22,
    backgroundColor: colors.gray_light,
    padding: 3
},
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  tabText: {
    ...textStyle.body_sm
  },
  activeText: {
    color: '#000',
    fontWeight: 'bold',
  },
  inactiveText: {
    color: '#888',
  },
});

export default VoiceOrTextMessage;
