import React, { useEffect, useRef, useState } from "react";
import { Transform, useBrushStore } from "../../zustand/useBrushStore";
import { socket } from "../../Main";
import { createLayerCanvas, redrawLayer } from "../../helpers/drawingHelpers";
import { layersCanvasMap } from "../../helpers/canvasHelpers";
type LayerPayload = {
  layerId: string;
  layerName: string;
  imageDataUrl: string;
  transform: Transform;
};

const LayerContainerVM = () => {
  const toggleLockLayers = useBrushStore((state) => state.toggleLockLayer);

  const addLayer = useBrushStore((state) => state.addLayer);
  const updateLayerTransform = useBrushStore(
    (state) => state.updateLayerTransform
  );

  const removeLayer = useBrushStore((state) => state.removeLayer);
  const setLayerImage = useBrushStore((state) => state.setLayerImage);

  const activeLayerId = useBrushStore((state) => state.activeLayerId);

  const [containerVisible, setContainerVisible] = useState(
    window.innerWidth > 660
  );

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

  const getScale = () => {
    return window.innerWidth <= 768 ? 0.82 : 1;
  };

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };
  const addComingLayer = ({
    layerId,
    layerName,
    imageDataUrl,
    transform,
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

          const finalTransform = transform || {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
            rotation: 0,
          };
          updateLayerTransform(layerId, finalTransform);
          setLayerImage(layerId, imageDataUrl);

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
    const scale = getScale();
    if (!containerVisible) {
      const scaledWidth = rect.width / scale;
      const scaledHeight = rect.height / scale;

      setLayersToolPositionOffset({
        x: toTheRight ? scaledWidth : 0,
        y: bottomMarginPercent - scaledHeight,
      });
    }
  };

  const handlePointerDown = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!containerVisible || e.target !== dragAreaElement.current) return;

    setIsDragging(true);
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = getPointerPosition(e);
    const scale = getScale();
    setDragStart({
      x: (pos.x - rect.left) / scale,
      y: (pos.y - rect.top) / scale,
    });
  };
  const animateSpring = () => {
    const friction = 0.22;
    const springStrength = 0.1;

    const currentVelocity = { ...velocity };
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
    const handlePointerMove = (e: MouseEvent | TouchEvent): void => {
      if (!toolbarElement.current || !isDragging) return;

      const pos =
        "touches" in e
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : { x: e.clientX, y: e.clientY };

      const scale = getScale();

      const newX = pos.x - dragStart.x * scale;
      const newY = pos.y - dragStart.y * scale;

      const vx = newX - lastPosition.current.x;
      const vy = newY - lastPosition.current.y;
      setVelocity({ x: vx, y: vy });

      const rotationAmount = Math.max(-15, Math.min(15, vx * 0.5));
      setRotation(rotationAmount);

      lastPosition.current = { x: newX, y: newY };
      setLayersToolPositionOffset({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
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

    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseup", handlePointerUp);
    document.addEventListener("touchmove", handlePointerMove, {
      passive: false,
    });
    document.addEventListener("touchend", handlePointerUp);

    return () => {
      document.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseup", handlePointerUp);
      document.removeEventListener("touchmove", handlePointerMove);
      document.removeEventListener("touchend", handlePointerUp);
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
    handlePointerDown,
  };
};

export default LayerContainerVM;
