import React, { useEffect, useRef, useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";
import { socket } from "../../Main";
type LayerPayload = {
  layerId: string;
  layerName: string;
};

const LayerContainerVM = () => {
  const toggleLockLayers = useBrushStore((state) => state.toggleLockLayer);

  const addLayer = useBrushStore((state) => state.addLayer);
  const removeLayer = useBrushStore((state) => state.removeLayer);

  const activeLayerId = useBrushStore((state) => state.activeLayerId);

  const [containerVisible, setContainerVisible] = useState(true);

  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const toolbarElement = useRef<HTMLDivElement>(null);
  const dragAreaElement = useRef<HTMLDivElement>(null);

  const [layersToolPositionOffset, setLayersToolPositionOffset] = useState({
    x: 0,
    y: 0,
  });
  const toTheRight = layersToolPositionOffset.x > window.innerWidth / 2;

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

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent): void => {
      if (!toolbarElement.current) return;
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setLayersToolPositionOffset({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
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
  }, [isDragging, dragStart,toggleLayerContainer]);

  const chooseContainerSide = (styles: CSSModuleClasses) => {
    return toTheRight ? styles.layerHiddenLeft : styles.layerHiddenRight;
  };

  return {
    activeLayerId,
    containerVisible,
    layersToolPositionOffset,
    toolbarElement,
    dragAreaElement,
    isDragging,
    toTheRight,

    chooseContainerSide,
    toggleLayerContainer,
    handleMouseDown,
  };
};

export default LayerContainerVM;
