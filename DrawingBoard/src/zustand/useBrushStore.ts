import { create } from "zustand";

type BrushState = {
  brushColor: number;
  setBrushColor: (color: number) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  usedColors: number[];
  addUsedColor: (color: number) => void;
};

export const useBrushStore = create<BrushState>((set) => ({
  brushColor: 0x000000,
  setBrushColor: (color) => set({ brushColor: color }),
  brushSize: 2,
  setBrushSize: (size) => set({ brushSize: size }),
  usedColors: [],
  addUsedColor: (color) =>
    set((state) => {
      if (state.usedColors.includes(color)) return state;
      return { usedColors: [...state.usedColors, color].slice(-6) };
    }),
}));
