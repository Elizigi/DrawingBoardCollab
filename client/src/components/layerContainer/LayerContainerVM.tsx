import React, { useEffect, useRef, useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";
import { socket } from "../../Main";
import { createLayerCanvas, redrawLayer } from "../../helpers/drawingHelpers";
import { layersCanvasMap } from "../../helpers/canvasHelpers";
type LayerPayload = {
  layerId: string;
  layerName: string;
  imageDataUrl: string;
};

const LayerContainerVM = () => {
  const toggleLockLayers = useBrushStore((state) => state.toggleLockLayer);

  const addLayer = useBrushStore((state) => state.addLayer);
  const removeLayer = useBrushStore((state) => state.removeLayer);
  const setLayerImage = useBrushStore((state) => state.setLayerImage);

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

  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<null | number>(null);

  const addComingLayer = ({
    layerId,
    layerName,
    imageDataUrl,
  }: LayerPayload) => {
    addLayer(layerName, layerId);
    createLayerCanvas(layerId);
    setLayerImage(layerId, imageDataUrl);
    if (imageDataUrl) {
      const img = new Image();
      img.src = imageDataUrl;
      img.onload = () => {
        const entry = layersCanvasMap[layerId];
        if (entry) {
          entry.image = img;
          redrawLayer(layerId);
        }
      };
    }
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
  const animateSpring = () => {
    const friction = 0.22;
    const springStrength = 0.1;

    let currentVelocity = { ...velocity };
    let currentRotation = rotation;

    const animate = () => {
      currentVelocity.x += -currentRotation * springStrength;

      currentVelocity.x *= friction;

      currentRotation += currentVelocity.x;

      if (
        Math.abs(currentVelocity.x) < 0.01 &&
        Math.abs(currentRotation) < 0.1
      ) {
        setRotation(0);
        setVelocity({ x: 0, y: 0 });
        return;
      }

      setRotation(currentRotation);
      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);
  };
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent): void => {
      if (!toolbarElement.current) return;
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const vx = e.clientX - lastPosition.current.x;
      const vy = e.clientY - lastPosition.current.y;
      setVelocity({ x: vx, y: vy });

      const rotationAmount = Math.max(-15, Math.min(15, vx * 0.5));
      setRotation(rotationAmount);

      lastPosition.current = { x: e.clientX, y: e.clientY };
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
        ) {
          toggleLayerContainer();
        } else {
          animateSpring();
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, toggleLayerContainer]);

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
    rotation,
    chooseContainerSide,
    toggleLayerContainer,
    handleMouseDown,
  };
};

export default LayerContainerVM;
