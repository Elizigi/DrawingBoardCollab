import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  const changeLayer = (id: string) => {
    setActiveLayer(id);
  };

  const handleLayerDown = (
    index: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggedLayer(index);
    setIsLayerDragged(true);
  };

  const layerLand = (e: MouseEvent) => {
    if (!isLayerDragged || draggedLayer === null) return;

    const draggedLayerPosition = layersPositions[draggedLayer];
    if (!draggedLayerPosition) return;

    const clientY = e.clientY;
    const isAbove = clientY < draggedLayerPosition.bottom;
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
  const [layersPositions, setLayersPositions] = useState<LayerPosition[]>([]);

  const layerRefs = useRef(new Map<string, HTMLButtonElement>());

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

  const getNewPositionIndex = (isAbove: boolean, clientY: number) => {
    if (draggedLayer === null) return -1;
    let newPositionIndex = -1;
    console.log("is mouse above?:",isAbove)
    if(isAbove){
    for (let i = draggedLayer; i < layersPositions.length; i++) {
      if (clientY > layersPositions[i].bottom) {
        newPositionIndex = i;
      }
    }}else{ for (let i = 0; i < draggedLayer; i++) {
      if (clientY > layersPositions[i].bottom) {
        newPositionIndex = i;
      }
    }
  }

    return newPositionIndex === -1 ? draggedLayer : newPositionIndex;
  };

  useEffect(() => {
    if (!isLayerDragged) return;

    const handleMouseMove = (e: MouseEvent) => {
      return e;
    };

    const handleMouseUp = (e: MouseEvent) => {
      console.log("layerRefs:", layerRefs);

      layerLand(e);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isLayerDragged, draggedLayer]);

  return { allLayers, activeLayerId, changeLayer, layerRefs, handleLayerDown };
};

export default LayerButtonsMV;
