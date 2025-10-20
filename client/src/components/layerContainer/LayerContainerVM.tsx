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

  const addLayer = useBrushStore((state) => state.addLayer);
  const removeLayer = useBrushStore((state) => state.removeLayer);

  const allLayers = useBrushStore((state) => state.layers);
  const activeLayerId = useBrushStore((state) => state.activeLayerId);

  const [containerVisible, setContainerVisible] = useState(true);

  const [newLayerName, setNewLayerName] = useState("");
  const [layerNameInputOpen, setLayerNameInputOpen] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const toolbarElement = useRef<HTMLDivElement>(null);
  const dragAreaElement = useRef<HTMLDivElement>(null);

  const [draggedLayer, setDraggedLayer] = useState("");
  const [isLayerDrag, setIsLayerDrag] = useState(false);

  const [layersPositions, setLayersPositions] = useState<LayerPosition[]>([]);

  const layerRefs = useRef(new Map<string, HTMLButtonElement>());
  const [layersToolPositionOffset, setLayersToolPositionOffset] = useState({
    x: 0,
    y: 0,
  });
  const toTheRight = layersToolPositionOffset.x > window.innerWidth / 2;

  useLayoutEffect(() => {
    for (const [id, element] of layerRefs.current.entries()) {
      if (element) {
        const rect = element.getBoundingClientRect();

        const midpoint = rect.top + rect.height / 2;

        setLayersPositions([
          ...layersPositions,
          {
            id: id,
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            midpoint,
          },
        ]);
      }
    }
  }, [allLayers]);

  const updateText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLayerName(e.target.value);
  };

  const addNewLayer = () => {
    if (newLayerName.trim().length < 2) return;
    const layerId = crypto.randomUUID();
    addLayer(newLayerName, layerId);

    socket.emit("new-layer", {
      layerId,
      layerName: newLayerName,
    });

    setLayerNameInputOpen(false);
    setNewLayerName("");
  };

  const deleteLayer = (layerId: string) => {
    if (onlineStatus.inRoom) return socket.emit("delete-layer", { layerId });
    removeLayer(layerId);
  };

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
    setIsLayerDrag(true);
    setDraggedLayer(id);
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

  const handlePlusBtnClick = () => {
    if (!layerNameInputOpen) return setLayerNameInputOpen(true);
    addNewLayer();
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

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent): void => {
      if (!toolbarElement.current) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setLayersToolPositionOffset({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
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
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

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
    newLayerName,
    allLayers,
    activeLayerId,
    layerNameInputOpen,
    containerVisible,
    layersToolPositionOffset,
    toolbarElement,
    dragAreaElement,
    isDragging,
    toTheRight,
    layerRefs,
    layersPositions,
    toggleLockLayer,
    chooseContainerSide,
    getArrowDir,
    deleteLayer,
    handlePlusBtnClick,
    updateText,
    changeLayer,
    changeVisible,
    toggleLayerContainer,
    handleMouseDown,
  };
};

export default LayerContainerVM;
