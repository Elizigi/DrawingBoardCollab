import React, { useEffect, useRef, useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";
import { onlineStatus, socket } from "../../Main";
type LayerPayload = {
  layerId: string;
  layerName: string;
};
const LayerContainerVM = () => {
  const setActiveLayer = useBrushStore((state) => state.setActiveLayer);
  const toggleLayer = useBrushStore((state) => state.toggleLayer);
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

  const [layersToolPositionOffset, setLayersToolPositionOffset] = useState({
    x: 0,
    y: 0,
  });
  const toTheRight = layersToolPositionOffset.x > window.innerWidth / 2;

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
  useEffect(() => {
    socket.on("add-layer", addComingLayer);
    socket.on("remove-layer", removingLayer);
    return () => {
      socket.off("add-layer", addComingLayer);
    };
  }, []);

  const changeVisible = (id: string) => {
    toggleLayer(id);

    if (activeLayerId === id) {
      const visibleLayer = allLayers.find(
        (layer) => layer.visible === true && layer.id !== id
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

  const handlePlusBtnClick = () => {
    if (!layerNameInputOpen) return setLayerNameInputOpen(true);
    addNewLayer();
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!toolbarElement.current || !containerVisible) return;

    setIsDragging(true);
    const rect = toolbarElement.current.getBoundingClientRect();
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
    isDragging,
    toTheRight,
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
