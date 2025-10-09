import React, { useEffect, useState } from "react";
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
  const deleteLayer = (layerId: string) => {
    if (onlineStatus.inRoom) return socket.emit("delete-layer", { layerId });
    removeLayer(layerId);
  };
  const addComingLayer = ({ layerId, layerName }: LayerPayload) => {
    console.log(layerId, layerName);
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
      const visibleLayer = allLayers.find((layer) => layer.visible === true&&layer.id!==id);
      const newActiveLayerID = visibleLayer ? visibleLayer.id : null;
      if (newActiveLayerID === null) {
        console.log("null");
      }
      setActiveLayer(newActiveLayerID);
    }
  };
  const changeLayer = (id: string) => {
    console.log(id);
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
    deleteLayer,
    handlePlusBtnClick,
    updateText,
    changeLayer,
    changeVisible,
    addNewLayer,
  };
};

export default LayerContainerVM;
