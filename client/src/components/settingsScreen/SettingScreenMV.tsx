import { useState } from "react";
import { canvasSize, resizeAllCanvases } from "../../helpers/canvasHelpers";

const SettingScreenMV = () => {
  const [canvasSizeValue, setCanvasSizeValue] = useState({
    height: canvasSize.height,
    width: canvasSize.width,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const setCanvasSize = () => {
    canvasSize.height = canvasSizeValue.height;
    canvasSize.width = canvasSizeValue.width;
    setModalOpen(false);
    resizeAllCanvases(canvasSizeValue.width, canvasSizeValue.height);
  };

  return {
    canvasSizeValue,
    modalOpen,
    setModalOpen,
    setCanvasSize,
    setCanvasSizeValue,
  };
};

export default SettingScreenMV;
