import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AxiosInstant from '../../config/axiosInstant';
const roomUrl = 'rooms'
const messageUrl = 'messages'

export const loadMoreMessages = createAsyncThunk(
  'rooms/load-more-messages',
  async ( {roomId, afterCursor, beforeCursor}, {rejectWithValue}) => {    
    try {
      let q = `${messageUrl}?roomId=${roomId}`
      if (afterCursor) q += `&afterCursor=${afterCursor}`
      if (beforeCursor) q += `&beforeCursor=${beforeCursor}`      
      const result =  await AxiosInstant.get(q)
      return {
        ...result,
        load: beforeCursor ? 'new' : 'old'
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)
export const loadMessagesFrom = createAsyncThunk(
  'rooms/load-messages-from',
  async ( {roomId, messageId}, {rejectWithValue}) => {        
    try {
      return await AxiosInstant.get(`${messageUrl}/from?roomId=${roomId}&messageId=${messageId}`)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)
export const getRoomById = createAsyncThunk(
  'rooms/get-room-by-id',
  async ( {roomId}, {rejectWithValue}) => {
    try {
      return await AxiosInstant.get(`${roomUrl}/${roomId}`)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)
export const getRoomByPartnerId = createAsyncThunk(
  'rooms/get-room-by-partner-id',
  async ( {partnerId}, {rejectWithValue}) => {
    try {
      return await AxiosInstant.get(`${roomUrl}/partner/${partnerId}`)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)
export const sendTextMsg = createAsyncThunk(
  'rooms/send-text-msg',
  async ( {roomId, data}, {rejectWithValue}) => {
    console.log('daaaaaa',data);
    
    try {
      const q = `${messageUrl}/${roomId}/text`
      return await AxiosInstant.post(q,data)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  roomId:'',
    partnerId:'',
    memberId: '',
    roomAvatarUrl: '',
    roomAvatarUrls: '',
    roomName: '',
    isGroup: false,
    members:[],
    messages:[],
    pagination:{},
    isWritingMsg:[],
    membersObj: {},
    memberWritingMsg:null,

    //thao tác trong room
    msgReply:null,

    isLoading: false
}

const currentRoomSlice = createSlice({
  name: 'currentRoom',
  initialState: initialState,
  reducers: {
    setCurrentRoom: (state, action) => {      
      const {id,roomAvatarUrl,roomAvatarUrls,roomName,type,memberCount} = action.payload
      state.roomId = id
      state.roomAvatarUrl = roomAvatarUrl
      state.roomAvatarUrls = roomAvatarUrls
      state.roomName = roomName
      state.type = type
      state.memberCount = memberCount
    },
    setPartnerId: (state, action) => {
      const {partnerId, partnerAvatarUrl} = action.payload
      state.partnerId = partnerId
      state.roomAvatarUrl = partnerAvatarUrl
      state.roomName = roomName
    },
    loadMoreMessage: () => {
    },
    setReceiver: (state, action) => {
      const { memerId, receivedAt } = action.payload
      state.members = state.members.map(m => {
        if (m.id == memerId) {          
          return {
            ...m,
            msgRTime: receivedAt
          }
        } else {
          return m
        }
      })
    },
    addNewMgs: (state, action) => {
      state.messages = [action.payload,...state.messages]
    },
    setMsgReply: (state, action) => {
      state.msgReply = action.payload
    },
    resetRoom: (state, action) => {
      state.pagination = {}
      state.roomId = ''
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadMoreMessages.pending, (state, action) => {
      state.isLoading = true
      state.messages = []
    })
    .addCase(loadMoreMessages.fulfilled, (state, action) => {
      const {data, pagination, load} = action.payload
      
      if (load == 'old') {
        state.messages = [...state.messages,...data]
        state.pagination.afterCursor = pagination.afterCursor
      }else{
        state.messages = [...data,...state.messages]
        state.pagination.beforeCursor = pagination.beforeCursor
      }
      state.isLoading = false
    })
    .addCase(loadMessagesFrom.pending, (state, action) => {
      state.isLoading = true
    })
    .addCase(loadMessagesFrom.fulfilled, (state, action) => {
      state.messages = []
      state.messages = action.payload.data
      state.pagination = action.payload.pagination
      state.isLoading = false
    })
    .addCase(getRoomById.pending, (state, action) => {
      state.isLoading = true
    })
    .addCase(getRoomByPartnerId.fulfilled, (state, action) => {
      const {memberId, members, roomAvatarUrl, roomName, id} = action.payload
      state.roomId = id
      state.roomAvatarUrl = roomAvatarUrl
      state.roomName = roomName
      state.memberId = memberId
      state.members = members
      let membersObj = {}
      members.forEach((mem) => {
        membersObj[mem.id] = mem
      });
      state.membersObj = membersObj
      state.isLoading = false
    })
    .addCase(getRoomById.fulfilled, (state, action) => {
      const {memberId, members, roomAvatarUrl, roomName, id} = action.payload
      state.roomId = id
      state.roomAvatarUrl = roomAvatarUrl
      state.roomName = roomName
      state.memberId = memberId
      state.members = members
      let membersObj = {}
      members.forEach((mem) => {
        membersObj[mem.id] = mem
      });
      state.membersObj = membersObj

      state.isLoading = false
    })
    .addCase(sendTextMsg.fulfilled, (state, action) => {      
      state.messages = [action.payload,...state.messages]
      const receivedMemberIds = action.payload.receivedMemberIds      
      receivedMemberIds.forEach(id => {
        state.membersObj[id] = {
          ...state.membersObj[id],
          msgRTime: action.payload.createdAt
        }
      });
      state.members = state.members.map(m => {
        return {
          ...m,
          ...(receivedMemberIds.includes(m.id) && {msgRTime: action.payload.createdAt})
        }
      })      
    })
  }
});

export const { 
  setCurrentRoom,
  setReceiver,
  addNewMgs,
  setMsgReply,
  resetRoom
} = currentRoomSlice.actions;

export default currentRoomSlice.reducer;
