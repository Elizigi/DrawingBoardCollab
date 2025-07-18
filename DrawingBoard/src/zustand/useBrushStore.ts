import { create } from "zustand";

type BrushState = {
  brushColor: number;
  setBrushColor: (color: number) => void;
};

export const useBrushStore = create<BrushState>((set) => ({
  brushColor: 0x000000,
  setBrushColor: (color) => set({ brushColor: color }),
}));
