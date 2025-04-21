import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Sound from 'react-native-sound';
import { colors } from '~/styles/Ui/colors';

// Tạo mảng nhịp âm với độ cao ngẫu nhiên
const generateWaveform = (count: number) => {
  return Array.from({ length: count }, () => Math.random() * 20 + 5);
};

const waveform = generateWaveform(30); // Tạo 30 thanh nhịp âm

const BAR_WIDTH = 4;
const BAR_MARGIN = 1;
const TOTAL_BAR_SPACE = BAR_WIDTH + BAR_MARGIN * 2;

const AudioPlayer = ({ media }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Sound | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tính toán tổng chiều rộng của tất cả các thanh nhịp âm
  const TOTAL_WIDTH = waveform.length * (BAR_WIDTH + BAR_MARGIN * 2);

  // Khởi tạo Sound khi component mount
  useEffect(() => {
    const path = media.localPath || media.uri;
    if (!path) return;

    const newSound = new Sound(path, '', (error) => {
      if (error) {
        console.log('Error loading sound:', error);
        return;
      }
      setSound(newSound);
      setDuration(newSound.getDuration());
    });

    return () => {
      newSound.release();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
    };
  }, [media]);

  const play = () => {
    if (!sound) return;

    const remainingTime = duration - currentTime;
    startPlayback(sound, remainingTime);
  };

  const startPlayback = (soundObj: Sound, playDuration: number) => {
    soundObj.play(() => {
      setIsPlaying(false);
      setCurrentTime(0);
      progressAnim.setValue(0);
      stopTimer();
    });
    setIsPlaying(true);
    startTimer();

    // Reset và bắt đầu animation mới với cấu hình mượt mà hơn
    progressAnim.setValue(currentTime / duration);
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
    progressAnimation.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: playDuration * 1000,
      useNativeDriver: true,
      easing: Easing.linear,
    });
    progressAnimation.current.start();
  };

  const pause = () => {
    if (!sound) return;
    sound.pause();
    stopTimer();
    setIsPlaying(false);
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
  };

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      sound?.getCurrentTime((sec) => {
        setCurrentTime(sec);
      });
    }, 100);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={isPlaying ? pause : play} style={styles.playButton}>
        <Text style={styles.playButtonText}>{isPlaying ? '⏸️' : '▶️'}</Text>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <View style={styles.waveformContainer}>
          {/* Các thanh nhịp âm */}
          {waveform.map((height, index) => {
            const barPosition = index * (BAR_WIDTH + BAR_MARGIN * 2);
            return (
              <Animated.View
                key={index}
                style={[
                  styles.barWrapper,
                  {
                    left: barPosition,
                  }
                ]}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: progressAnim.interpolate({
                        inputRange: [
                          (barPosition + BAR_WIDTH) / TOTAL_WIDTH,
                          (barPosition + BAR_WIDTH) / TOTAL_WIDTH,
                        ],
                        outputRange: ['#E0E0E0', '#0068FF'],
                        extrapolate: 'clamp',
                      }),
                    }
                  ]}
                />
              </Animated.View>
            );
          })}

          {/* Thanh progress */}
          <Animated.View
            style={[
              styles.progressLine,
              {
                transform: [{
                  translateX: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, TOTAL_WIDTH - BAR_WIDTH * 3],
                    extrapolate: 'clamp'
                  })
                }]
              }
            ]}
          />
        </View>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    width: 200,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  playButton: {
    backgroundColor: '#0068FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  waveformContainer: {
    height: 24,
    position: 'relative',
    marginBottom: 4,
    overflow: 'hidden',
  },
  barWrapper: {
    position: 'absolute',
    height: '100%',
    width: BAR_WIDTH,
    justifyContent: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: BAR_WIDTH / 2,
    position: 'absolute',
  },
  progressLine: {
    position: 'absolute',
    width: BAR_WIDTH * 1,
    height: '100%',
    backgroundColor: 'black',
    borderRadius: BAR_WIDTH / 2,
    opacity: 0.6,
    zIndex: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  }
});

export default AudioPlayer;
