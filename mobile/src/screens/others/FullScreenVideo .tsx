import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  Animated,
  BackHandler,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import Slider from '@react-native-community/slider';
import { Assets } from '~/styles/Ui/assets';
import { MainNavProp } from '~/routers/types';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const CustomVideoPlayer = ({ route }) => {
  const { videoUrl } = route.params;
  const videoRef = useRef<VideoRef>(null);
  const mainNav = useNavigation<MainNavProp>();

  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0)); // Animation cho controls

  // Tự ẩn controls sau 3 giây
  useEffect(() => {
    let timeout;
    if (showControls) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      timeout = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  const togglePlayPause = () => {
    setPaused(!paused);
    setShowControls(true); // Hiển thị controls khi nhấn play/pause
  };

  const handleProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  const handleLoad = (data) => {
    setDuration(data.duration);
  };

  const handleSeek = (value) => {
    videoRef.current?.seek(value);
    setCurrentTime(value);
    setShowControls(true); // Hiển thị controls khi seek
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      mainNav.goBack()
      return true; 
    });
    return () => backHandler.remove();
  }, []);
  return (
    <View style={styles.screen}>
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            paused={paused}
            resizeMode="contain"
            style={styles.video}
            onProgress={handleProgress}
            onLoad={handleLoad}
          />

          {/* Nút Play/Pause trung tâm */}
          <Animated.View style={[styles.playButtonContainer, { opacity: fadeAnim }]}>
            {paused && (
              <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                <Image source={Assets.icons.play} style={styles.playIcon} />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* Thanh điều khiển phía dưới */}
      <Animated.View style={[styles.controls, { opacity: fadeAnim }]}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={currentTime}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#ff0000" // Màu giống YouTube
          maximumTrackTintColor="#888"
          thumbTintColor="#ff0000"
        />

        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButtonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Nền mờ giống YouTube
    borderRadius: 50,
    padding: 10,
  },
  playIcon: {
    width: 48,
    height: 48,
  },
  controls: {
    marginTop: 10,
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Nền mờ cho controls
    paddingVertical: 5,
    borderRadius: 5,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
});

export default CustomVideoPlayer;