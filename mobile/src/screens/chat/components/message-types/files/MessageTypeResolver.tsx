import React from 'react';
import { Text } from 'react-native';
import FileImage from './FileImage';
import FileVideo from './FileVideo';
import FileAudio from './FileAudio';
import FileDocument from './FileDocument';
import { MessageContentType } from '~/features/message/dto/message.enum';
import type { MessageItemDisplay } from '~/database/types/message.type';
import ImageMessage from '../../ImageMessage';
import AudioPlayer from '../AudioMessage';
import FileDownload from './FileDownloadProps';
import FilePDF from './FilePdf';
import ItemMessage from '../LinkMessage';

export const resolveMessageComponent = (message: MessageItemDisplay) => {
  const { type, content, media, linkMetadata } = message;

  // Xử lý tin nhắn link (có linkMetadata)
  if (linkMetadata) {
    return <ItemMessage message={message} />;
  }

  // Xử lý tin nhắn text
  if (type === MessageContentType.TEXT) {
    return <Text style={{ paddingHorizontal: 8 }}>{content}</Text>;
  }

  // Nếu không có media, trả về null
  if (!media || media.length === 0) {
    return null;
  }

  // Xử lý các loại media
  switch (type) {
    case MessageContentType.IMAGE:
      return <ImageMessage message={message} />;

    case MessageContentType.VIDEO:
      // Truyền toàn bộ message thay vì chỉ media
      return <FileVideo media={message.media} onPress={()=>{}}/>;

    case MessageContentType.VOICE:
      // Truyền toàn bộ message thay vì chỉ media
      return <AudioPlayer media={message.media} />;

    case MessageContentType.FILE:
      // Xử lý từng phần tử trong mảng media
      return media.map((item, index) => {
        // Giả sử FileDownload chỉ hiển thị khi không có url hoặc localPath
        if (!item.url && !item.localPath) {
          return (
            <FileDownload
              key={`${index}-${item.url || item.localPath}`}
              fileName="File đang tải"
              fileSize={0} // Không có bytes trong MediaRes, để mặc định là 0
              progress={10}
              onRetry={() => {
                // Xử lý retry tải file
              }}
            />
          );
        }

        // Dựa vào type của media (vì mimeType không có trong MediaRes)
        if (item.type === 'image') {
          return <FileImage key={`${index}-${item.url || item.localPath}`} media={item} onPress={() => {}} />;
        }
        if (item.type === 'video') {
          return <FileVideo key={`${index}-${item.url || item.localPath}`} media={item} onPress={()=>{}} />;
        }
        if (item.type === 'audio') {
          return <FileAudio key={`${index}-${item.url || item.localPath}`} media={item} />;
        }
        if (item.type === 'pdf') {
          return <FilePDF key={`${index}-${item.url || item.localPath}`} media={item} />;
        }
        return <FileDocument key={`${index}-${item.url || item.localPath}`} media={item} />;
      });

    default:
      return null;
  }
};