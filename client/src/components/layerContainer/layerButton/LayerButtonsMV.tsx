import { useEffect, useRef, useState } from "react";
import { useBrushStore } from "../../../zustand/useBrushStore";
type LayerPosition = {
  id: string;
  top: number;
  bottom: number;
  height: number;
  midpoint: number;
};
const LayerButtonsMV = () => {
  const activeLayerId = useBrushStore((state) => state.activeLayerId);
  const setActiveLayer = useBrushStore((state) => state.setActiveLayer);
  const allLayers = useBrushStore((state) => state.layers);
  const setLayers = useBrushStore((state) => state.setLayers);

  const [isLayerDragged, setIsLayerDragged] = useState(false);
  const [draggedLayer, setDraggedLayer] = useState<null | number>(null);
  const [layerOffset, setLayerOffset] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);

  const layersPositionsRef = useRef<LayerPosition[]>([]);
  const layerRefs = useRef(new Map<string, HTMLButtonElement>());

  const layerContainerRef = useRef<HTMLDivElement>(null);
  const [layersContainerBounds, setLayersContainerBounds] = useState({
    top: 0,
    bottom: 0,
  });

  const changeLayer = (id: string) => {
    setActiveLayer(id);
  };

  const handleLayerDown = (
    index: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!layerContainerRef.current) return;
    const newPositions: LayerPosition[] = [];
    for (const layer of allLayers) {
      const element = layerRefs.current.get(layer.id);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      newPositions.push({
        id: layer.id,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        midpoint,
      });
    }
    const layersContainerBounding =
      layerContainerRef.current.getBoundingClientRect();
    setLayersContainerBounds({
      top: layersContainerBounding.top,
      bottom: layersContainerBounding.bottom,
    });
    layersPositionsRef.current = newPositions;

    const clickedRect = layersPositionsRef.current[index];
    setDragStartOffset(e.clientY - clickedRect.top);

    e.stopPropagation();
    e.preventDefault();
    setDraggedLayer(index);
    setIsLayerDragged(true);
  };

  const layerLand = (e: MouseEvent) => {
    if (!isLayerDragged || draggedLayer === null) return;

    const draggedLayerPosition = layersPositionsRef.current[draggedLayer];
    if (!draggedLayerPosition) return;

    const clientY = e.clientY;
    const isAbove = clientY < draggedLayerPosition.midpoint;

    const newPositionIndex = isAbove
      ? findPositionAbove(clientY)
      : findPositionBelow(clientY);

    const temp = [...allLayers];
    const [removed] = temp.splice(draggedLayer, 1);
    const insertAt = newPositionIndex === -1 ? draggedLayer : newPositionIndex;
    temp.splice(insertAt, 0, removed);
    setLayers(temp);
    setLayerOffset(0);
    setDragStartOffset(0);
    setIsLayerDragged(false);
    setDraggedLayer(null);
  };

  const findPositionAbove = (clientY: number) => {
    if (draggedLayer === null) return -1;
    let newPositionIndex = -1;

    for (let i = draggedLayer + 1; i < layersPositionsRef.current.length; i++) {
      if (clientY < layersPositionsRef.current[i].midpoint) {
        newPositionIndex = i;
      }
      if (clientY > layersPositionsRef.current[i].midpoint) break;
    }

    return newPositionIndex === -1 ? draggedLayer : newPositionIndex;
  };

  const findPositionBelow = (clientY: number) => {
    if (draggedLayer === null) return -1;
    let newPositionIndex = -1;

    for (let i = draggedLayer - 1; i >= 0; i--) {
      if (clientY > layersPositionsRef.current[i].midpoint) {
        newPositionIndex = i;
      }
      if (clientY < layersPositionsRef.current[i].midpoint) break;
    }
    return newPositionIndex === -1 ? draggedLayer : newPositionIndex;
  };
  const checkBoundary = (clientY: number, draggedLayer: number) => {
    const draggedLayerPosition = layersPositionsRef.current[draggedLayer];

    const layerPositionOffset =
      clientY - draggedLayerPosition.top - dragStartOffset;
    if (
      layerPositionOffset >
      layersContainerBounds.bottom - draggedLayerPosition.midpoint
    ) {
      return layersContainerBounds.bottom - draggedLayerPosition.midpoint;
    }
    if (
      layerPositionOffset <
      layersContainerBounds.top - draggedLayerPosition.midpoint
    ) {
      return layersContainerBounds.top - draggedLayerPosition.midpoint;
    }
    return layerPositionOffset;
  };

  useEffect(() => {
    if (!isLayerDragged) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (draggedLayer === null) return;
      const clientY = e.clientY;

      const offsetY = checkBoundary(clientY, draggedLayer);
      setLayerOffset(offsetY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      layerLand(e);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isLayerDragged, draggedLayer]);

  return {
    allLayers,
    activeLayerId,
    layerRefs,
    layerOffset,
    draggedLayer,
    layerContainerRef,
    handleLayerDown,
    changeLayer,
  };
};

export default LayerButtonsMV;
