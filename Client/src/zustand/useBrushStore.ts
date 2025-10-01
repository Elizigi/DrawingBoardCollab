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
  opacity: number;
  layerId: string;
  final?: boolean;
};

type BrushState = {
  isMouseDown: boolean;
  setMouseDown: (truth: boolean) => void;

  brushColor: number;
  setBrushColor: (color: number) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  usedColors: number[];
  addUsedColor: (color: number) => void;

  brushOpacity: number;
  setOpacity: (opacity: number) => void;

  layers: LayerMeta[];
  activeLayerId: string;
  addLayer: (name: string,id:string) => void;
  
  setLayers: (layers: LayerMeta[]) => void;
  setActiveLayer: (id: string) => void;
  toggleLayer: (id: string) => void;

  strokes: Stroke[];
  addStroke: (stroke: Stroke) => void;
  clearStrokes: () => void;
};

export const useBrushStore = create<BrushState>((set, _) => ({
  isMouseDown: false,
  setMouseDown: (truth) => set({ isMouseDown: truth }),
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

  brushOpacity: 100,
  setOpacity: (opacity) => set({ brushOpacity: opacity }),

  layers: [{ id: "layer-1", name: "Layer 1", visible: true }],
  activeLayerId: "layer-1",

  strokes: [],
  addStroke: (stroke) =>
    set((state) => {
      if (!stroke.final) return state;
      const strokes = [...state.strokes, stroke];
      return { strokes };
    }),
  clearStrokes: () => set({ strokes: [] }),

  setLayers: (layers) => {
    set(() => {
      return {
        layers: layers,
        activeLayerId: layers[0].id,
      };
    });
  },
  addLayer: (name,id) => {
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
