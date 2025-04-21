import React, {
    forwardRef,
    useMemo,
    useEffect,
    useRef,
    useState,
  } from 'react';
  import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    AppState,
  } from 'react-native';
  import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
  import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
  import AudioRecorderPlayer from 'react-native-audio-recorder-player';
  import { Assets } from '~/styles/Ui/assets';
import { useChatStore } from '~/stores/zustand/chat.store';
import { MMKVStore } from '~/utils/storage';
import { MessageContentType } from '~/features/message/dto/message.enum';
import { _MessageSentReq } from '~/features/message/dto/message.dto.parent';
import { File, MessageService } from '~/features/message/messageService';
import DocumentPicker from 'react-native-document-picker';
  
  const audioRecorderPlayer = new AudioRecorderPlayer();
  
  const VoiceBottomSheet = forwardRef<BottomSheetMethods>((_, ref) => {
    const snapPoints = useMemo(() => ['100%'], []);
    const [recordSecs, setRecordSecs] = useState(0);
    const {curentMessageRepling} = useChatStore()
    const [timer, setTimer] = useState('00:00');
    const [isRecording, setIsRecording] = useState(true);
    const intervalRef = useRef<NodeJS.Timer | null>(null);
    const [audioPath, setAudioPath] = useState<string | null>(null); // Store audio path
    const currentMemberMyId = MMKVStore.getCurrentMemberMeId();
    const currentRoomId = MMKVStore.getCurrentRoomId();
    // Ghi âm và đếm giây
    const startRecording = async () => {
        try {
          // luôn cố gắng dừng nếu trước đó recorder chưa stop đúng cách
          try {
            await audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
          } catch (e) {
            // Không sao nếu recorder không chạy
          }
      
          const uri = await audioRecorderPlayer.startRecorder();
          setAudioPath(uri); // Capture the audio path
          setIsRecording(true);
      
          audioRecorderPlayer.addRecordBackListener((e) => {
            setRecordSecs(e.currentPosition);
            setTimer(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
          });
      
          console.log('Recording started:', uri);
        } catch (err) {
          console.log('startRecording error:', err);
        }
      };
      
      const stopRecording = async (): Promise<{
        audioPath: string;
        duration: number;
        fileName: string;
      } | null> => {
        try {
          const result = await audioRecorderPlayer.stopRecorder(); // result là path
          audioRecorderPlayer.removeRecordBackListener();
          setIsRecording(false);
      
          const fileName = result.split('/').pop() || 'recorded-audio.m4a';
      
          return {
            audioPath: result,
            duration: recordSecs,
            fileName,
          };
        } catch (e) {
          console.log('stopRecording error:', e);
          return null;
        }
      };
      
      
  
    const reset = () => {
      setRecordSecs(0);
      setTimer('00:00');
      setIsRecording(false);
    };
  
    const handleSheetChange = (index: number) => {
      if (index === 0) {
        // Mở bottom sheet
        startRecording();
      } else {
        // Đóng bottom sheet
        stopRecording();
        reset();
      }
    };
  
    const handleDelete = () => {
      console.log('❌ Xoá bản ghi');
      stopRecording();
      reset();
      (ref as any)?.current?.close();
    };
  
    
    const handleSend = async () => {
        console.log('📤 Gửi bản ghi');
        const audioInfo = await stopRecording();
        reset();
      
        if (audioInfo) {
          const { audioPath, duration, fileName } = audioInfo;
      
          const dto: _MessageSentReq = {
            roomId: currentRoomId,
            content: '.', // hoặc bạn có thể để content = '' nếu phía server chấp nhận
            contentType: MessageContentType.VOICE,
            replyMessageId: curentMessageRepling?.id,
          };
      
          const audioFile = {
            uri: audioPath,
            fileName: fileName,
            type: 'audio/m4a',
            duration: duration,
          } as File;
      
          await MessageService.SentMessageMedia(dto, currentMemberMyId, [audioFile]);
        }
      
        (ref as any)?.current?.close();
      };
      
  
    const handlePlay = () => {
      console.log('▶️ Nghe lại');
      // TODO: play lại ghi âm
    };
  
    const openDocument = async () => {
      try {
        const result = await DocumentPicker.pick({
          type: [DocumentPicker.types.allFiles],
        });

        // Tạo dto cho tin nhắn
        const dto: _MessageSentReq = {
          roomId: currentRoomId,
          content: '.',  // hoặc để trống nếu server chấp nhận
          contentType: MessageContentType.FILE, // Thay đổi type thành FILE
          replyMessageId: curentMessageRepling?.id,
        };

        // Chuyển đổi file được chọn sang định dạng phù hợp
        const fileToSend = {
          uri: result[0].uri,
          fileName: result[0].name,
          type: result[0].type,
        } as File;

        // Gửi tin nhắn với file đính kèm
        await MessageService.SentMessageMedia(dto, currentMemberMyId, [fileToSend]);

        // Đóng bottom sheet sau khi gửi
        (ref as any)?.current?.close();

      } catch (err) {
        console.log('Lỗi pick file: ', err);
      }
    };
  
  return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onChange={handleSheetChange}
        backgroundStyle={styles.bottomSheet}
      >
        <BottomSheetView style={styles.content}>
          {/* Waveform + Timer */}
          <View style={styles.waveformContainer}>
            <View style={styles.waveform} />
            <Text style={styles.timer}>{timer}</Text>
        </View>

          {/* Buttons: Xóa - Gửi - Nghe lại */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Image source={Assets.icons.ghost_blue} style={styles.icon} />
            <Text style={styles.label}>Xoá</Text>
          </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={handleSend}
            >
              <Image
                source={Assets.icons.send_blue}
                style={[styles.icon, { tintColor: '#fff' }]}
              />
              <Text style={[styles.label, { color: '#fff' }]}>Gửi</Text>
          </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handlePlay}>
              <Image source={Assets.icons.ghost_blue} style={styles.icon} />
            <Text style={styles.label}>Nghe lại</Text>
          </TouchableOpacity>
        </View>
        </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
    bottomSheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
  content: {
    flex: 1,
    alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
  },
    waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
      backgroundColor: '#e6f0ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
      marginBottom: 20,
  },
    waveform: {
    width: 150,
      height: 32,
    backgroundColor: '#007AFF',
      borderRadius: 6,
      marginRight: 12,
  },
  timer: {
    fontSize: 16,
      fontWeight: 'bold',
    color: '#007AFF',
  },
    buttonsContainer: {
    flexDirection: 'row',
      width: '100%',
    justifyContent: 'space-around',
      marginTop: 10,
  },
    actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
    sendButton: {
    backgroundColor: '#007AFF',
      padding: 20,
    borderRadius: 50,
  },
  icon: {
      width: 28,
      height: 28,
      tintColor: '#007AFF',
  },
  label: {
      marginTop: 6,
    fontSize: 14,
    color: '#333',
  },
});

export default VoiceBottomSheet;
