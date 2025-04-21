import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { MessageItemDisplay } from '~/database/types/message.type';
import { colors } from '~/styles/Ui/colors';
import YoutubePlayer from 'react-native-youtube-iframe';
import axios from 'axios';
import { API_KEY } from '~/utils/enviroment';

interface Props {
  message: MessageItemDisplay;
  onLongPress?: (pageY: number) => void;
}

interface VideoInfo {
  title: string;
  channel: string;
  views: string;
}

interface RelatedVideo {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

const ItemMessage: React.FC<Props> = React.memo(({ message, onLongPress }) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);

  const extractYouTubeVideoId = (url) => {
    try {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(regex);
      return match ? match[1] : '';
    } catch (error) {
      console.error('Lỗi trích xuất video ID:', error);
      return '';
    }
  };

  const fetchVideoInfo = async (videoId: string) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            id: videoId,
            part: 'snippet,statistics',
            key: API_KEY,
          },
        }
      );
      if (response.data.items && response.data.items.length > 0) {
        const videoData = response.data.items[0];
        setVideoInfo({
          title: videoData.snippet.title,
          channel: videoData.snippet.channelTitle,
          views: `${(parseInt(videoData.statistics.viewCount) / 1000000).toFixed(1)} Tr lượt xem`,
        });
        fetchRelatedVideos(videoId);
      } else {
        Alert.alert('Lỗi', 'Video không tồn tại hoặc không công khai');
        setShowPlayer(false);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lấy thông tin video');
      setShowPlayer(false);
    }
  };

  const fetchRelatedVideos = async (videoId: string) => {
    if (!videoId) {
      console.log('Không có video ID để lấy video đề xuất');
      setRelatedVideos([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            q: videoId,
            // relatedToVideoId: videoId,
            part: 'snippet',
            type: 'video',
            maxResults: 10,
            key: "AIzaSyBtM1pYOyKDEicTedMRqT3b7pBoaCtBvlU",
          },
        }
      );
      console.log('..., sss', response);

      if (response.data.items && response.data.items.length > 0) {
        const videos = response.data.items.map((item) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channel: item.snippet.channelTitle,
        }));
        setRelatedVideos(videos);
      } else {
        console.log('Không có video đề xuất');
        setRelatedVideos([]);
      }
    } catch (error) {
      console.log('///', error);
      
      setRelatedVideos([]);
      Alert.alert('Lỗi', 'Không thể lấy video đề xuất');
    }
  };

  const handlePress = () => {
    if (!message.content) {
      Alert.alert('Lỗi', 'URL không hợp lệ');
      return;
    }

    const videoId = extractYouTubeVideoId(message.content);
    if (!videoId) {
      Alert.alert('Lỗi', 'Không thể nhận diện video YouTube');
      return;
    }

    console.log('YouTube Video ID:', videoId);
    setVideoId(videoId);
    fetchVideoInfo(videoId);
    setShowPlayer(true);
  };

  const getDomainLabel = (url: string): string => {
    try {
      const { hostname } = new URL(url);
      return hostname.replace('www.', '');
    } catch (error) {
      return 'Link';
    }
  };

  const renderRelatedVideo = ({ item }: { item: RelatedVideo }) => (
    <TouchableOpacity
      style={styles.relatedVideo}
      onPress={() => {
        setVideoId(item.id);
        fetchVideoInfo(item.id);
      }}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.relatedThumbnail}
        resizeMode="cover"
      />
      <View style={styles.relatedTextContainer}>
        <Text style={styles.relatedTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.relatedChannel}>{item.channel}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      <View style={{ height: 220 }}>
        <YoutubePlayer
          height={220}
          play={true}
          videoId={videoId}
          onError={(error) => {
            console.error('YouTube Player error:', error);
            Alert.alert('Lỗi', 'Không thể phát video YouTube');
            setShowPlayer(false);
          }}
          onChangeState={(state) => {
            if (state === 'ended') {
              setShowPlayer(false);
              Alert.alert('Thông báo', 'Video đã kết thúc');
            }
          }}
        />
      </View>
      {videoInfo && (
        <View style={styles.videoInfoContainer}>
          <Text style={styles.videoTitle}>{videoInfo.title}</Text>
          <Text style={styles.videoChannel}>
            {videoInfo.channel} • {videoInfo.views}
          </Text>
        </View>
      )}
      <Text style={styles.relatedHeader}>Video đề xuất</Text>
    </>
  );

  if (!message.content) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        onLongPress={(e) => onLongPress?.(e.nativeEvent.pageY)}
        onPress={message.linkMetadata ? handlePress : undefined}
        style={styles.container}
      >
        <View style={styles.messageContent}>
          {message.linkMetadata ? (
            <View style={styles.linkContainer}>
              <Text style={styles.link} numberOfLines={2} ellipsizeMode="tail">
                {message.content}
              </Text>
              <View style={styles.previewContainer}>
                {message.linkMetadata.thumbnail ? (
                  <Image
                    source={{ uri: message.linkMetadata.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                    onError={() => console.log('Failed to load thumbnail')}
                  />
                ) : (
                  <View style={styles.placeholderThumbnail} />
                )}
                <View style={styles.textContainer}>
                  <Text style={styles.sourceLabel}>
                    {message.linkMetadata.type || getDomainLabel(message.content)}
                  </Text>
                  <Text
                    style={styles.title}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {message.linkMetadata.title || 'Untitled'}
                  </Text>
                  <Text
                    style={styles.source}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {message.linkMetadata.source ||
                      getDomainLabel(message.content)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.text}>{message.content}</Text>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPlayer}
        animationType="slide"
        onRequestClose={() => setShowPlayer(false)}
      >
        <FlatList
          data={relatedVideos}
          renderItem={renderRelatedVideo}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPlayer(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          }
          style={{ flex: 1, backgroundColor: '#fff' }}
        />
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {},
  selfSent: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    padding: 10,
  },
  otherSent: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    padding: 10,
  },
  messageContent: {
    flex: 1,
    flexDirection: 'column',
  },
  timeBox: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  linkContainer: {
    borderRadius: 8,
    padding: 0,
  },
  linkContainerSelf: {
    backgroundColor: 'transparent',
  },
  linkContainerOther: {
    backgroundColor: 'transparent',
  },
  link: {
    fontSize: 14,
    color: '#1E90FF',
    textDecorationLine: 'underline',
    padding: 5,
  },
  previewContainer: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '120%',
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  placeholderThumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#E0E0E0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  textContainer: {
    padding: 8,
  },
  sourceLabel: {
    fontSize: 12,
    color: colors.secondary,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  source: {
    fontSize: 12,
    color: '#8E8E93',
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  status: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  heart: {
    fontSize: 16,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 5,
    marginLeft: 10,
  },
  closeButton: {
    backgroundColor: '#1E90FF',
    padding: 10,
    alignItems: 'center',
    margin: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  videoInfoContainer: {
    padding: 10,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  videoChannel: {
    fontSize: 14,
    color: '#606060',
    marginTop: 5,
  },
  relatedHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 10,
    color: '#000',
  },
  relatedVideo: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  relatedThumbnail: {
    width: 120,
    height: 68,
    borderRadius: 5,
  },
  relatedTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  relatedTitle: {
    fontSize: 14,
    color: '#000',
  },
  relatedChannel: {
    fontSize: 12,
    color: '#606060',
    marginTop: 5,
  },
});

export default ItemMessage;