import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '~/styles/Ui/colors';

const FileAudio: React.FC<{ media: any }> = ({ media }) => {
  return (
    <View style={styles.container}>
      <View style={styles.waveform}>
        {/* Waveform visualization */}
      </View>
      <TouchableOpacity style={styles.playButton}>
        <Text>▶️</Text>
      </TouchableOpacity>
      <Text style={styles.duration}>
        {media.duration ? `${Math.floor(media.duration)}s` : '0:00'}
      </Text>
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
  waveform: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  playButton: {
    marginRight: 8,
  },
  duration: {
    fontSize: 12,
    color: colors.gray_icon,
  },
});

export default FileAudio;
