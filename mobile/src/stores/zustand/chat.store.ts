import {create} from 'zustand';
import {PageOptionsDto} from '~/features/common/pagination/paginationDto';
import {
  _MessageSentReq,
  _MessageSentRes,
} from '~/features/message/dto/message.dto.parent';
import {MessagParente} from '~/features/message/dto/message.dto.nested';

interface ChatStore {
  curentPagination: PageOptionsDto;
  setPagination: (pagination: PageOptionsDto)=>void
  curentMessageRepling: MessagParente | null;
  memberWriting: string;
  resetMemberWriting: (userName: string, status: boolean) => void; 
  setCurentMessageRepling: (message: MessagParente  | null) => void;
  clearData: () => void;
  loadingMore: boolean;
  hasMore: boolean;
}

const initialState = {
  curentMessageRepling: null,
  curentPagination: {},
  memberWriting: "",
  room: null,
  loadingMore: false,
  hasMore: true,
};

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  setCurentMessageRepling: (message: MessagParente | null) => {
    set({ curentMessageRepling: message ?? null });
  },
  setPagination: (pagination: PageOptionsDto)=>{
    set({ curentPagination: pagination ?? {}})
  },
   resetMemberWriting: (userName: string, status: boolean) => {
      if (status) {
        set({ memberWriting: userName }); 
      } else {
        set({ memberWriting: "" }); 
      }
    },
  // Xóa dữ liệu
  clearData: () => {
    set((state) => ({
      ...initialState,
      memberWriting: "",
      curentMessageRepling: state.curentMessageRepling,
    }));
  },
  
}));
