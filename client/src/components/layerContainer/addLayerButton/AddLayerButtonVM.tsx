import React, { useState } from "react";
import { socket } from "../../../Main";
import { useBrushStore } from "../../../zustand/useBrushStore";

const AddLayerButtonVM = () => {
  const [newLayerName, setNewLayerName] = useState("");
  const [layerNameInputOpen, setLayerNameInputOpen] = useState(false);
  const addLayer = useBrushStore((state) => state.addLayer);

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
  const closeBar = () => {
    setLayerNameInputOpen(false);
    setNewLayerName("")
  };
  const handlePlusBtnClick = () => {
    if (!layerNameInputOpen) return setLayerNameInputOpen(true);
    addNewLayer();
  };
  return { updateText, handlePlusBtnClick,closeBar, layerNameInputOpen, newLayerName };
};

export default AddLayerButtonVM;
