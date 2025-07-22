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
  usedColors: new Array(6).fill(null),
  addUsedColor: (color) =>
    set((state) => {
    const withoutCurrent = state.usedColors.filter(c => c !== color );
    return { usedColors: [color, ...withoutCurrent, 0, 0, 0, 0, 0, 0].slice(0, 6) };
    }),
}));
