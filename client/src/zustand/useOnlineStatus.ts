import { create } from "zustand";

export const defaultMaxUsers = 20;

export interface OnlineStatusState {
  inRoom: boolean;
  isAdmin: boolean;
  maxUsers: number;
  isOnline: boolean;
  setOnline: (val: boolean) => void;
  setInRoom: (val: boolean) => void;
  setIsAdmin: (val: boolean) => void;
  setMaxUsers: (val: number) => void;
}
export const useOnlineStatus = create<OnlineStatusState>((set) => ({
  inRoom: false,
  isAdmin: false,
  isOnline: false,
  maxUsers: defaultMaxUsers,
  setOnline: (val) => set({ isOnline: val }),
  setInRoom: (val) => set({ inRoom: val }),
  setIsAdmin: (val) => set({ isAdmin: val }),
  setMaxUsers: (val) => set({ maxUsers: val }),
}));
