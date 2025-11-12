import { create } from "zustand";

export const defaultMaxUsers = 20;

export interface OnlineStatusState {
  isOnline: boolean;
  inRoom: boolean;
  isAdmin: boolean;
  maxUsers: number;
  setOnline: (isOnline: boolean) => void;
  setInRoom: (inRoom: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setMaxUsers: (maxUsers: number) => void;
}
export const useOnlineStatus = create<OnlineStatusState>((set) => ({
  inRoom: false,
  isAdmin: false,
  isOnline: false,
  maxUsers: defaultMaxUsers,
  setOnline: (isOnline) => set({ isOnline: isOnline }),
  setInRoom: (inRoom) => set({ inRoom: inRoom }),
  setIsAdmin: (isAdmin) => set({ isAdmin: isAdmin }),
  setMaxUsers: (maxUsers) => set({ maxUsers: maxUsers }),
}));
