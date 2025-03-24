// stores/zustand/roomStore.ts
import { create } from "zustand";
import { Room } from "~/features/room/dto/room.dto.nested";
import { RoomService } from "~/features/room/roomService";

interface RoomStore {
  rooms: Room[];
  currentRoomId: string;
  currentRoom: {roomAvatar: string, roomName: string} | null;
  setCurrentRoom: (room: {roomAvatar: string, roomName: string}) => void;
  currentPartnerId: string;
  resetCurrentRoomId: (roomId: string) => void;
  resetCurrentPartnerId: (partnerId: string) => void;
  unReadMessagesRooms: Record<string, number>;
  fetchRooms: () => Promise<void>;
  resetUnReadCount: (id: string) => void;
  clear: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  rooms: [],
  currentRoomId: "",
  currentRoom: null,
  currentPartnerId: "",
  unReadMessagesRooms: {},

  resetCurrentRoomId: (roomId: string) => {
    set({ currentRoomId: roomId });
  },
  resetCurrentPartnerId: (partnerId: string) => {
    set({ currentPartnerId: partnerId });
  },
  setCurrentRoom: (room: {roomAvatar: string, roomName: string}) => {
    set({ currentRoom: room });
  },
  fetchRooms: async () => {
    const data = await RoomService.getAllRoom();
    if (!data || !Array.isArray(data)) return;

    const sortedRooms = data.sort((a, b) => {
      const timeA = a.lastMsg?.createdAt ? new Date(a.lastMsg.createdAt).getTime() : 0;
      const timeB = b.lastMsg?.createdAt ? new Date(b.lastMsg.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    set({ rooms: sortedRooms });
  },

  resetUnReadCount: (id: string) => {
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === id ? { ...room, unReadMsgCount: 0 } : room
      ),
    }));
  },

  clear: () => {
    set({
      rooms: [],
      currentRoomId: "",
      currentPartnerId: "",
      unReadMessagesRooms: {},
    });
  },
}));