import TopRightToolbar from "../topRightToolbar/TopRightToolbar";
import BrushToolbar from "../brushToolbar/BrushToolbar";
import LayersContainer from "../layerContainer/LayerContainer";

export const Toolbar = () => {
  return (
    <div>
      <BrushToolbar />
      <LayersContainer />

      <TopRightToolbar />
    </div>
  );
};
