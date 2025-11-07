import { create } from "zustand";

export const defaultLayer = "background-layer";

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export type EventAlert = {
  eventType: EventType;
  name?: string;
  eventId: string;
};

export const EventTypes = {
  userKickedEvent: "have been kicked",
  KickedEvent: "You have been kicked",
  roomCreatedEvent: "Room created",
  joinedEvent: "Room joined",
  joinEvent: "has joined",
  roomClosedEvent: "Room closed",
  userLeftEvent: "has left!",
  default: "Disconnected from room",
} as const;

type LayerMeta = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  imageDataUrl?: string;
};

export type Stroke = {
  strokeId: string;
  points: { x: number; y: number }[];
  color: number;
  size: number;
  opacity: number;
  layerId: string;
  isRemote?: boolean;
  final?: boolean;
};

export type BrushState = {
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
  toggleLockLayer: (layerId: string) => void;
  removeLayer: (id: string) => void;
  renameLayer: (layerId: string, newName: string) => void;
  setLayerImage: (layerId: string, imageDataUrl: string) => void;

  lockedLayersIds: Map<string, null>;

  setLayers: (layers: LayerMeta[]) => void;
  setActiveLayer: (id: string | null) => void;
  toggleLayer: (id: string) => void;
  strokes: Stroke[];
  removedStrokesArray: Stroke[];

  addStroke: (stroke: Stroke) => void;
  clearStrokes: () => void;
  setStrokes: (strokes: Stroke[]) => void;
  removeStroke: (lastLocalStroke: Stroke) => void;
  reAssignStroke: (strokeId: string) => void;

  events: EventAlert[];
  addEvent: (eventType: EventType, name: string) => void;
  removeEvent: (eventId: string) => void;
};

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
  lockedLayersIds: new Map<string, null>(),
  layers: [
    { id: defaultLayer, name: defaultLayer, visible: true, locked: false },
  ],
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
  removedStrokesArray: [],
  removeStroke: (lastLocalStroke: Stroke) =>
    set((state) => {
      const newStrokes = state.strokes.filter(
        (stroke) => stroke.strokeId !== lastLocalStroke.strokeId
      );
      const isLocal = !lastLocalStroke.isRemote;
      const updatedLocalArray = isLocal
        ? [lastLocalStroke, ...state.removedStrokesArray].slice(0, 10)
        : state.removedStrokesArray;
      return {
        strokes: newStrokes,
        removedStrokesArray: updatedLocalArray,
      };
    }),

  addStroke: (stroke) =>
    set((state) => {
      if (!stroke.final) return state;

      const strokes = [...state.strokes, stroke];

      return { strokes };
    }),

  reAssignStroke: (strokeId: string) =>
    set((state) => {
      const filteredArray = state.removedStrokesArray.filter(
        (stroke) => stroke.strokeId !== strokeId
      );

      return { removedStrokesArray: filteredArray };
    }),

  clearStrokes: () => set({ strokes: [] }),

  setStrokes: (strokes) => {
    set({ strokes: strokes });
  },
  setLayers: (layers) => {
    set((state) => {
      const newActiveId =
        helperGetActiveLayerId(layers) ?? state.activeLayerId ?? null;
      return {
        layers,
        activeLayerId: newActiveId,
      };
    });
  },

  addLayer: (name, id) => {
    set((state) => {
      const newLayers = [
        ...state.layers,
        { id, name, visible: true, locked: false },
      ];

      return {
        layers: newLayers,
        activeLayerId: state.activeLayerId ?? id,
      };
    });
  },
  renameLayer: (layerId, newName) => {
    set((state) => {
      const newLayers = state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, name: newName } : layer
      );

      return { layers: newLayers };
    });
  },
  toggleLockLayer: (layerId) => {
    set((state) => {
      const newLayers = state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      );
      const newLockedLayersIds = new Map(state.lockedLayersIds);
      if (newLockedLayersIds.has(layerId)) newLockedLayersIds.delete(layerId);
      else newLockedLayersIds.set(layerId, null);
      return {
        layers: newLayers,
        lockedLayersIds: newLockedLayersIds,
        activeLayerId: helperGetActiveLayerId(newLayers),
      };
    });
  },

  removeLayer: (id) => {
    set((state) => {
      if (state.layers.length <= 1) return state;
      const newLayers = state.layers.filter((layer) => layer.id !== id);

      return {
        layers: newLayers,
        strokes: state.strokes.filter((stroke) => stroke.layerId !== id),
        activeLayerId: helperGetActiveLayerId(newLayers),
      };
    });
  },

  setActiveLayer: (id) =>
    set((state) => {
      const allowedToChange = state.layers.find(
        (layer) => layer.id === id && layer.visible && !layer.locked
      );
      if (!allowedToChange) return state;
      return { activeLayerId: id };
    }),

  toggleLayer: (id) => {
    set((state) => {
      const newLayers = state.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      );
      return {
        layers: newLayers,
        activeLayerId: helperGetActiveLayerId(newLayers),
      };
    });
  },
  setLayerImage: (layerId, imageDataUrl) => {
    set((state) => {
      const newLayers = state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, imageDataUrl } : layer
      );
      return { layers: newLayers };
    });
  },
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

function helperGetActiveLayerId(layers: LayerMeta[]) {
  const availableLayer = layers.find((layer) => layer.visible && !layer.locked);
  return availableLayer?.id || null;
}
