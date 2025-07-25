import { create } from "zustand";

type LayerMeta = {
  id: string;
  name: string;
  visible: boolean;
};
export type Stroke = {
  points: { x: number; y: number }[];
  color: number;
  size: number;
  layerId: string;
};

type BrushState = {
  brushColor: number;
  setBrushColor: (color: number) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  usedColors: number[];
  addUsedColor: (color: number) => void;

  layers: LayerMeta[];
  activeLayerId: string;
  addLayer: (name: string) => void;
  setActiveLayer: (id: string) => void;
  toggleLayer: (id: string) => void;

  strokes: Stroke[];
  addStroke: (stroke: Stroke) => void;
  clearStrokes: () => void;
};

export const useBrushStore = create<BrushState>((set, _) => ({
  brushColor: 0x000000,
  setBrushColor: (color) => set({ brushColor: color }),
  brushSize: 2,
  setBrushSize: (size) => set({ brushSize: size }),
  usedColors: new Array(6).fill(null),
  addUsedColor: (color) =>
    set((state) => {
      const withoutCurrent = state.usedColors.filter((c) => c !== color);
      return {
        usedColors: [color, ...withoutCurrent].slice(0, 6),
      };
    }),

  layers: [{ id: "layer-1", name: "Layer 1", visible: true }],
  activeLayerId: "layer-1",

  strokes: [],
  addStroke: (stroke) =>
    set((state) => ({
      strokes: [...state.strokes, stroke],
    })),
  clearStrokes: () => set({ strokes: [] }),

  addLayer: (name) => {
    const id = crypto.randomUUID();
    set((state) => ({
      layers: [...state.layers, { id, name, visible: true }],
      activeLayerId: state.layers.length === 0 ? id : state.activeLayerId,
    }));
  },

  setActiveLayer: (id) => set({ activeLayerId: id }),

  toggleLayer: (id) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    })),
}));
