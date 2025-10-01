import React, { useEffect, useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";
import { socket } from "../../Main";
type LayerPayload = {
  layerId: string;
  layerName: string;
};
const LayerContainerVM = () => {
  const setActiveLayer = useBrushStore((state) => state.setActiveLayer);
  const toggleLayer = useBrushStore((state) => state.toggleLayer);
  const addLayer = useBrushStore((state) => state.addLayer);

  const allLayers = useBrushStore((state) => state.layers);
  const activeLayerId = useBrushStore((state) => state.activeLayerId);

  const [newLayerName, setNewLayerName] = useState("");
  const [layerNameInputOpen, setLayerNameInputOpen] = useState(false);

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
  const addComingLayer = ({ layerId, layerName }: LayerPayload) => {
    console.log(layerId, layerName);
    addLayer(layerName, layerId);
  };

  useEffect(() => {
    socket.on("add-layer", addComingLayer);

    return () => {
      socket.off("add-layer", addComingLayer);
    };
  }, []);

  const changeVisible = (id: string) => {
    toggleLayer(id);
  };
  const changeLayer = (id: string) => {
    setActiveLayer(id);
  };
  const handlePlusBtnClick = () => {
    if (!layerNameInputOpen) return setLayerNameInputOpen(true);
    addNewLayer();
  };
  return {
    newLayerName,
    allLayers,
    activeLayerId,
    layerNameInputOpen,
    handlePlusBtnClick,
    updateText,
    changeLayer,
    changeVisible,
    addNewLayer,
  };
};

export default LayerContainerVM;
