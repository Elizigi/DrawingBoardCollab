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
  local?: boolean;
  final?: boolean;
};
export const EventTypes = {
  userKickedEvent: "have been kicked",
  KickedEvent: "you have been kicked",
  joinEvent: "has joined",
  roomClosedEvent: "room closed",
  userLeftEvent: "has left!",
  default: "disconnected from room",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export type EventAlert = {
  eventType: EventType;
  name?: string;
  eventId: string;
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
  activeLayerId: string | null;
  addLayer: (name: string, id: string) => void;

  removeLayer: (id: string) => void;

  setLayers: (layers: LayerMeta[]) => void;
  setActiveLayer: (id: string | null) => void;
  toggleLayer: (id: string) => void;

  strokes: Stroke[];

  addStroke: (stroke: Stroke) => void;
  clearStrokes: () => void;
  setStrokes: (strokes: Stroke[]) => void;

  events: EventAlert[];
  addEvent: (eventType: EventType, name: string) => void;
  removeEvent: (eventId: string) => void;
};

const defaultLayer = "background-layer";

export const useBrushStore = create<BrushState>((set, get) => ({
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
        activeLayerId: layers[0].id || null,
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
      const layers = state.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      );
      return { layers };
    }),
  events: [],
  addEvent: (eventType, name) =>
    set((state) => {
      const eventId = crypto.randomUUID();
      setTimeout(() => get().removeEvent(eventId), 2500);

      return {
        events: [{ eventType, name, eventId }, ...state.events],
      };
    }),
  removeEvent: (eventId) => {
    set((state) => {
      return {
        events: state.events.filter((event) => event.eventId !== eventId),
      };
    });
  },
}));
