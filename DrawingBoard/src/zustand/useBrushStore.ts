import { create } from "zustand";

type BrushState = {
  brushColor: number;
  setBrushColor: (color: number) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
};

export const useBrushStore = create<BrushState>((set) => ({
  brushColor: 0x000000,
  setBrushColor: (color) => set({ brushColor: color }),
    brushSize: 2,
  setBrushSize: (size) => set({brushSize:size})
}));
