import TopRightToolbar from "../topRightToolbar/TopRightToolbar";
import BrushToolbar from "../brushToolbar/BrushToolbar";
import LayersContainer from "../layerContainer/LayerContainer";
import EventAlert from "../eventAlert/EventAlert";

export const Toolbar = () => {
  return (
    <div>
      <BrushToolbar />
      <LayersContainer />

      <TopRightToolbar />
      <EventAlert />
    </div>
  );
};
