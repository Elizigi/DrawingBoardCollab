import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";
import { onlineStatus, socket } from "../../Main";
type LayerPayload = {
  layerId: string;
  layerName: string;
};
type LayerPosition = {
  id: string;
  top: number;
  bottom: number;
  height: number;
  midpoint: number;
};
const LayerContainerVM = () => {
  const setActiveLayer = useBrushStore((state) => state.setActiveLayer);
  const toggleLayer = useBrushStore((state) => state.toggleLayer);
  const toggleLockLayers = useBrushStore((state) => state.toggleLockLayer);
  const setLayers = useBrushStore((state) => state.setLayers);

  const addLayer = useBrushStore((state) => state.addLayer);
  const removeLayer = useBrushStore((state) => state.removeLayer);

  const allLayers = useBrushStore((state) => state.layers);
  const activeLayerId = useBrushStore((state) => state.activeLayerId);

  const [containerVisible, setContainerVisible] = useState(true);

  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const toolbarElement = useRef<HTMLDivElement>(null);
  const dragAreaElement = useRef<HTMLDivElement>(null);

  const [draggedLayer, setDraggedLayer] = useState<null | number>(null);
  const [isLayerDragged, setIsLayerDragged] = useState(false);

  const [layersPositions, setLayersPositions] = useState<LayerPosition[]>([]);

  const layerRefs = useRef(new Map<string, HTMLButtonElement>());
  const [layersToolPositionOffset, setLayersToolPositionOffset] = useState({
    x: 0,
    y: 0,
  });
  const toTheRight = layersToolPositionOffset.x > window.innerWidth / 2;

  useLayoutEffect(() => {
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

    setLayersPositions(newPositions);
  }, [allLayers]);


  const addComingLayer = ({ layerId, layerName }: LayerPayload) => {
    addLayer(layerName, layerId);
  };
  const removingLayer = ({ layerId }: { layerId: string }) => {
    removeLayer(layerId);
  };
  const lockALayer = ({ layerId }: { layerId: string }) => {
    toggleLockLayers(layerId);
  };
  useEffect(() => {
    socket.on("add-layer", addComingLayer);
    socket.on("remove-layer", removingLayer);
    socket.on("lock-layer", lockALayer);

    return () => {
      socket.off("add-layer", addComingLayer);
      socket.off("remove-layer", removingLayer);
      socket.off("lock-layer", lockALayer);
    };
  }, []);

  const toggleLockLayer = (layerId: string) => {
    if (onlineStatus.inRoom && !onlineStatus.isAdmin) return;
    toggleLockLayers(layerId);
    if (onlineStatus.inRoom && onlineStatus.isAdmin)
      socket.emit("locked-layer", { layerId });
  };

  const changeVisible = (id: string) => {
    toggleLayer(id);

    if (activeLayerId === id) {
      const visibleLayer = allLayers.find(
        (layer) => layer.visible === true && layer.id !== id && !layer.locked
      );
      const newActiveLayerID = visibleLayer ? visibleLayer.id : null;

      setActiveLayer(newActiveLayerID);
    }
  };

  const changeLayer = (id: string) => {
    setActiveLayer(id);
  };

  const toggleLayerContainer = () => {
    setContainerVisible(!containerVisible);
    const box = toolbarElement.current as HTMLDivElement;
    const rect = box.getBoundingClientRect();
    const bottomMarginPercent = (window.innerHeight * 90) / 100;

    if (!containerVisible)
      setLayersToolPositionOffset({
        x: toTheRight ? window.innerWidth - rect.width : 0,
        y: bottomMarginPercent - rect.height,
      });
  };


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerVisible || e.target !== dragAreaElement.current) return;

    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };
  const getNewPositionIndex = (isAbove: boolean, clientY: number) => {
    if (draggedLayer === null) return -1;
    let newPositionIndex = -1;

      for (let i = 0; i < layersPositions.length; i++) {
        if (clientY > layersPositions[i].bottom) {
          newPositionIndex = i;
        }
      }
   
    console.log(newPositionIndex,"aaaaaaaaaaaa")
    return newPositionIndex === -1 ? draggedLayer : newPositionIndex;
  };

  const handleLayerDown = (
    index: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggedLayer(index);
    console.log(index, "this is layer pos");
    setIsLayerDragged(true);
  };
  const layerLand = (e: MouseEvent) => {
    if (!isLayerDragged || draggedLayer === null) return;

    const draggedLayerPosition = layersPositions[draggedLayer];
    if (!draggedLayerPosition) return;

    const clientY = e.clientY;
    const isAbove = clientY > draggedLayerPosition.bottom;
    const newPositionIndex = getNewPositionIndex(isAbove, clientY);
    console.log(newPositionIndex);
    const temp = [...allLayers];
    const [removed] = temp.splice(draggedLayer, 1);
    const insertAt = newPositionIndex === -1 ? draggedLayer : newPositionIndex;
    temp.splice(insertAt, 0, removed);
    setLayers(temp);
    setIsLayerDragged(false);
    setDraggedLayer(null);
  };

  useEffect(() => {
    if (!isDragging && !isLayerDragged) return;
    const handleMouseMove = (e: MouseEvent): void => {
      if (!toolbarElement.current) return;
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setLayersToolPositionOffset({ x: newX, y: newY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      layerLand(e);
      if (isDragging) {
        setIsDragging(false);
        const box = toolbarElement.current as HTMLDivElement;
        const rect = box.getBoundingClientRect();

        if (
          rect.right > window.innerWidth ||
          rect.height <= 0 ||
          rect.left < 0 ||
          rect.top < 0
        )
          toggleLayerContainer();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, draggedLayer]);

  const getArrowDir = (): string => {
    if (
      (!toTheRight && containerVisible) ||
      (toTheRight && !containerVisible)
    ) {
      return "↩";
    }
    return "↪";
  };
  const chooseContainerSide = (styles: CSSModuleClasses) => {
    return toTheRight ? styles.layerHiddenLeft : styles.layerHiddenRight;
  };

  return {
    allLayers,
    activeLayerId,
    containerVisible,
    layersToolPositionOffset,
    toolbarElement,
    dragAreaElement,
    isDragging,
    toTheRight,
    layerRefs,
    layersPositions,
    handleLayerDown,
    toggleLockLayer,
    chooseContainerSide,
    getArrowDir,
    changeLayer,
    changeVisible,
    toggleLayerContainer,
    handleMouseDown,
  };
};

export default LayerContainerVM;
