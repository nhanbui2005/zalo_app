import { create } from "zustand";

interface StateStore {
  allowNotification: boolean;
  clear: () => void;
  setAllowNotification: (value: boolean) => void;
}

export const useStateStore = create<StateStore>((set) => ({
  allowNotification: false, 
  clear: () => {
    set({ allowNotification: false }); // Đặt lại giá trị mặc định
  },
  setAllowNotification: (value: boolean) => {
    set({ allowNotification: value }); // Đúng cú pháp để cập nhật state
  },
}));
