import { create } from 'zustand';
import { PageOptionsDto } from '~/features/common/pagination/paginationDto';
import {
  _MessageSentReq,
  _MessageSentRes,
} from '~/features/message/dto/message.dto.parent';
import { MessagParente } from '~/features/message/dto/message.dto.nested';
import { MessageService } from '~/features/message/messageService';
import { MessageContentType } from '~/features/message/dto/message.enum';
import { MessageItemDisplay } from '~/database/types/message.type';

interface ImageItem {
  uri: string;
  fileName: string;
  type: string;
  selected: boolean;
  with: number,
  height: number
}

interface ChatStore {
  messagesList: MessageItemDisplay[];
  curentPagination: PageOptionsDto;
  setPagination: (pagination: PageOptionsDto) => void;
  curentMessageRepling: MessagParente | null;
  memberWriting: string;
  resetMemberWriting: (userName: string, status: boolean) => void;
  setCurentMessageRepling: (message: MessagParente | null) => void;
  clearData: () => void;
  loadingMore: boolean;
  hasMore: boolean;
  images: ImageItem[];
  setImages: (images: ImageItem[]) => void;
  clearImages: () => void;
  sendMessage: (
    roomId: string,
    currentMemberMyId: string,
    text?: string
  ) => Promise<void>;
}

const initialState = {
  messagesList: [],
  curentMessageRepling: null,
  curentPagination: {},
  memberWriting: "",
  room: null,
  loadingMore: false,
  hasMore: true,
  images: [],
};

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,
  setCurentMessageRepling: (message: MessagParente | null) => {
    set({ curentMessageRepling: message ?? null });
  },
  setPagination: (pagination: PageOptionsDto) => {
    set({ curentPagination: pagination ?? {} });
  },
  resetMemberWriting: (userName: string, status: boolean) => {
    if (status) {
      set({ memberWriting: userName });
    } else {
      set({ memberWriting: "" });
    }
  },
  clearData: () => {
    set((state) => ({
      ...initialState,
      memberWriting: "",
      curentMessageRepling: state.curentMessageRepling,
      images: [],
    }));
  },

  setImages: (images: ImageItem[]) => {
    set({ images });
  },
  clearImages: () => {
    set({ images: [] });
  },

  sendMessage: async (roomId: string, currentMemberMyId: string, text?: string) => {
    const { images, curentMessageRepling } = get();
  
    if (!roomId || !currentMemberMyId) return;
  
    const selectedImages = images.filter(img => img.selected);
    const hasText = text && text?.length > 0;
    const hasMedia = selectedImages && selectedImages.length > 0;
  
    if (!hasText && !hasMedia) return;
  
    const dto: _MessageSentReq = {
      roomId,
      content: hasText ? text!.trim() : '.',
      contentType: hasMedia ? MessageContentType.IMAGE : MessageContentType.TEXT,
      replyMessageId: curentMessageRepling?.id,
    };
  
    try {      
      await MessageService.SentMessage(dto, currentMemberMyId, selectedImages as any);
      set({ images: [], curentMessageRepling: null });
    } catch (error) {
      console.error('Send message error:', error);
    }
  }
}));