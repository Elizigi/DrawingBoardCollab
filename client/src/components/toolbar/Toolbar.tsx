import TopRightToolbar from "../topRightToolbar/TopRightToolbar";
import BrushToolbar from "../brushToolbar/BrushToolbar";
import LayersContainer from "../layerContainer/LayerContainer";
import EventAlert from "../eventAlert/EventAlert";
import ContextMenu from "../contextMenu/ContextMenu";

export const Toolbar = () => {
  return (
    <div>
      <BrushToolbar />
      <LayersContainer />

      <TopRightToolbar />
      <EventAlert />
      <ContextMenu />
    </div>
  );
};
