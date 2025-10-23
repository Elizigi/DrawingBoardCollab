import { useBrushStore } from "../../../zustand/useBrushStore";

const ToggleLayerVisibilityMV = () => {
  const allLayers = useBrushStore((state) => state.layers);
  const toggleLayer = useBrushStore((state) => state.toggleLayer);
  const activeLayerId = useBrushStore((state) => state.activeLayerId);
  const setActiveLayer = useBrushStore((state) => state.setActiveLayer);

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
  return { changeVisible };
};

export default ToggleLayerVisibilityMV;
