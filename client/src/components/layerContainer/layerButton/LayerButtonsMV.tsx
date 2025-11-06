import { useEffect, useRef, useState } from "react";
import { useBrushStore } from "../../../zustand/useBrushStore";
import { onlineStatus, socket } from "../../../Main";

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
  const renameLayer = useBrushStore((state) => state.renameLayer);

  const [isLayerDragged, setIsLayerDragged] = useState(false);
  const [draggedLayer, setDraggedLayer] = useState<null | number>(null);
  const [layerOffset, setLayerOffset] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);

  const [canDrag, setCanDrag] = useState(false);

  const [layerPotentialPosition, setLayerPotentialPosition] = useState(0);

  const layersPositionsRef = useRef<LayerPosition[]>([]);
  const layerRefs = useRef(new Map<string, HTMLButtonElement>());

  const layerContainerRef = useRef<HTMLDivElement>(null);
  const [layersContainerBounds, setLayersContainerBounds] = useState({
    top: 0,
    bottom: 0,
  });
  const layerPotentialPositionRef = useRef(-1);
  const dragStartY = useRef(0);
  const dragThreshold = 15;

  const [isNameEdit, setIsNameEdit] = useState(false);

  const changeLayer = (id: string) => {
    setActiveLayer(id);
  };
  const handleKeyPress = (
    layerId: string,
    e: React.KeyboardEvent<HTMLInputElement>,
    oldName: string
  ) => {
    if (e.key === "Enter") {
      setNewName(layerId, e.currentTarget.value, oldName);
    }
  };
  const setNewName = (layerId: string, newName: string, oldName: string) => {
    setIsNameEdit(false);
    if (newName.trim().length < 2 || oldName === newName) return;
    renameLayer(layerId, newName);

    if (onlineStatus.inRoom && onlineStatus.isAdmin) {
      socket.emit("renamed-layer", layerId, newName);
    }
  };
  const handleLayerDown = (
    index: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!layerContainerRef.current || allLayers.length <= 1) return;
    if (onlineStatus.inRoom && !onlineStatus.isAdmin) return;
    dragStartY.current = e.clientY;
    const layersContainerBounding =
      layerContainerRef.current.getBoundingClientRect();
    const containerTop = layersContainerBounding.top;
    const newPositions: LayerPosition[] = [];
    for (const layer of allLayers) {
      const element = layerRefs.current.get(layer.id);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const topRel = rect.top - containerTop;
      const midpointRel = topRel + rect.height / 2;
      newPositions.push({
        id: layer.id,
        top: topRel,
        bottom: topRel + rect.height,
        height: rect.height,
        midpoint: midpointRel,
      });
    }

    setLayersContainerBounds({
      top: layersContainerBounding.top,
      bottom: layersContainerBounding.bottom,
    });
    layersPositionsRef.current = newPositions;

    const clickedRect = layersPositionsRef.current[index];
    const clientYRel = e.clientY - layersContainerBounding.top;
    setDragStartOffset(clientYRel - clickedRect.midpoint);

    e.stopPropagation();
    e.preventDefault();
    setDraggedLayer(index);
    setIsLayerDragged(true);
  };

  const findPositionInsertion = () => {
    const potentialPos = layerPotentialPositionRef.current;
    if (potentialPos === -1 || draggedLayer === null) {
      return draggedLayer ?? 0;
    }

    if (potentialPos > draggedLayer) {
      return potentialPos - 1;
    }

    return potentialPos;
  };

  const layerLand = () => {
    if (!isLayerDragged || draggedLayer === null) return;
    const insertAt = findPositionInsertion();

    const temp = [...allLayers];
    const [removed] = temp.splice(draggedLayer, 1);

    temp.splice(insertAt, 0, removed);
    setLayers(temp);
    setLayerOffset(0);
    setDragStartOffset(0);
    setIsLayerDragged(false);
    setDraggedLayer(null);
    setLayerPotentialPosition(-1);
    setCanDrag(false);
    if (onlineStatus.isAdmin) {
      socket.emit("layer-reordered", draggedLayer, insertAt);
    }
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

  const topCalculations = (index: number) => {
    if (draggedLayer === index) return layerOffset;
    if (draggedLayer !== null && layerPotentialPosition > index) return 60;

    return 0;
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
    const pos = layersPositionsRef.current[draggedLayer];
    if (!pos) return 0;
    const clientYRel = clientY - layersContainerBounds.top;

    const layerPositionOffset = clientYRel - dragStartOffset;
    const containerHeight =
      layersContainerBounds.bottom - layersContainerBounds.top;
    const maxTop = containerHeight - pos.height;

    let newTop = layerPositionOffset;
    if (newTop < 0) newTop = 0;
    if (newTop > maxTop) newTop = maxTop;
    return newTop;
  };
  useEffect(() => {
    layerPotentialPositionRef.current = layerPotentialPosition;
  }, [layerPotentialPosition]);

  useEffect(() => {
    if (!isLayerDragged) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (draggedLayer === null) return;

      const clientY = e.clientY;
      const deltaY = e.clientY - dragStartY.current;

      if (Math.abs(deltaY) < dragThreshold) {
        return;
      }
      setCanDrag(true);
      const clientYRel = clientY - layersContainerBounds.top;

      const draggedLayerPosition = layersPositionsRef.current[draggedLayer];
      if (!draggedLayerPosition) return;

      const offsetY = checkBoundary(clientY, draggedLayer);

      setLayerOffset(offsetY);
      const isAbove = clientYRel < draggedLayerPosition.midpoint;

      const newPositionIndex = isAbove
        ? findPositionAbove(clientYRel)
        : findPositionBelow(clientYRel);

      layerPotentialPositionRef.current = newPositionIndex;
      setLayerPotentialPosition(newPositionIndex);
    };

    const handleMouseUp = () => {
      layerLand();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isLayerDragged,
    draggedLayer,
    allLayers,
    layersPositionsRef,
    layerOffset,
  ]);
  const reorderLayers = (draggedLayer: number, insertAt: number) => {
    const freshLayers = useBrushStore.getState().layers;
    if (
      draggedLayer < 0 ||
      draggedLayer >= freshLayers.length ||
      insertAt < 0 ||
      insertAt > freshLayers.length
    )
      return;
    const temp = [...freshLayers];
    console.log({ draggedLayer, insertAt, temp, allLayers });

    const [removed] = temp.splice(draggedLayer, 1);
    if (!removed) return;
    temp.splice(insertAt, 0, removed);
    setLayers(temp);
  };

  useEffect(() => {
    socket.on("reorder-layer", reorderLayers);
    socket.on("rename-layer", renameLayer);

    return () => {
      socket.off("reorder-layer", reorderLayers);
      socket.off("rename-layer", renameLayer);
    };
  }, []);
  return {
    allLayers,
    activeLayerId,
    layerRefs,
    draggedLayer,
    layerContainerRef,
    canDrag,
    isNameEdit,
    handleKeyPress,
    setNewName,
    setIsNameEdit,
    topCalculations,
    handleLayerDown,
    changeLayer,
  };
};

export default LayerButtonsMV;
