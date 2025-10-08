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
  local?:boolean;
  final?: boolean;
};

export interface DrawingState {}

type BrushState = {
  pendingPoints: { x: number; y: number }[];
  lastPoint: { x: number; y: number } | null;
  lastStrokeTime: number;

  setLastPoint: (point: { x: number; y: number } | null) => void;
  addPendingPoint: (point: { x: number; y: number }) => void;
  clearPendingStroke: () => void;
  updateLastStrokeTime: (time: number) => void;
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
  activeLayerId: string|null;
  addLayer: (name: string, id: string) => void;

  removeLayer: (id: string) => void;

  setLayers: (layers: LayerMeta[]) => void;
  setActiveLayer: (id: string) => void;
  toggleLayer: (id: string) => void;

  strokes: Stroke[];
  addStroke: (stroke: Stroke) => void;
  clearStrokes: () => void;
  setStrokes: (strokes: Stroke[]) => void;
};

const defaultLayer = "background-layer";

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

  layers: [{ id: defaultLayer, name: defaultLayer, visible: true }],
  activeLayerId: defaultLayer,

  pendingPoints: [],
  lastPoint: null,
  lastStrokeTime: 0,

  setLastPoint: (point) => set({ lastPoint: point }),
  addPendingPoint: (point) =>
    set((state) => ({
      pendingPoints: [...state.pendingPoints, point], 
    })),
  clearPendingStroke: () =>
    set({
      pendingPoints: [],
      lastPoint: null,
    }),
  updateLastStrokeTime: (time) => set({ lastStrokeTime: time }),

  strokes: [],
  addStroke: (stroke) =>
    set((state) => {
      if (!stroke.final) return state;
      const strokes = [...state.strokes, stroke];
      return { strokes };
    }),

  clearStrokes: () => set({ strokes: [] }),

  setStrokes: (strokes) => {
    set({ strokes: strokes });
  },
  setLayers: (layers) => {
    set(() => {
      return {
        layers: layers,
        activeLayerId: layers[0].id,
      };
    });
  },
  addLayer: (name, id) => {
    set((state) => ({
      layers: [...state.layers, { id, name, visible: true }],
      activeLayerId: state.layers.length === 0 ? id : state.activeLayerId,
    }));
  },

  removeLayer: (id) => {
    set((state) => {
      if (state.layers.length <= 1) return state;
      const newLayers = state.layers.filter((layer) => layer.id !== id);

      return {
        layers: newLayers,
        strokes: state.strokes.filter((stroke) => stroke.layerId !== id),
        activeLayerId:
          state.activeLayerId === id ? newLayers[0]?.id : state.activeLayerId,
      };
    });
  },

  setActiveLayer: (id) => set({ activeLayerId: id }),

 toggleLayer: (id) =>
    set((state) => {
      // 1. Get the layer being toggled and its new visibility
      const layerToToggle = state.layers.find((l) => l.id === id);
      if (!layerToToggle) return state; // Safety check
      const newVisibility = !layerToToggle.visible;

      // 2. Create the new layers array
      const newLayers = state.layers.map((l) =>
        l.id === id ? { ...l, visible: newVisibility } : l
      );

      let newActiveLayerId = state.activeLayerId;

      if (newVisibility) {
        // 3. If turning a layer ON, it should become the active layer
        newActiveLayerId = id;
      } else if (id === state.activeLayerId) {
        // 4. If turning the currently active layer OFF, find a new active layer
        
        // Find the next visible layer in the new array, excluding the one we just turned off
        const nextVisibleLayer = newLayers.find((l) => l.visible);
        
        // If there's a visible layer, make it active, otherwise set to null
        newActiveLayerId = nextVisibleLayer ? nextVisibleLayer.id : null;
      }

      return {
        layers: newLayers,
        activeLayerId: newActiveLayerId,
      };
    }),
}));
