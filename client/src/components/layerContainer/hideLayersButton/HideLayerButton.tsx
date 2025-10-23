import { FC } from "react";
import styles from "./HideLayerButton.module.scss";
import HideLayerButtonMV from "./HideLayerButtonMV";
interface HideLayerButtonProps {
  toggleLayerContainer: () => void;
  containerVisible: boolean;
  toTheRight: boolean;
}

const HideLayerButton: FC<HideLayerButtonProps> = ({
  toggleLayerContainer,
  containerVisible,
  toTheRight,
}) => {
  const { getArrowDir } = HideLayerButtonMV(toTheRight, containerVisible);
  return (
    <button
      className={`${styles.hideLayersButton} ${toTheRight ? styles.toRight : styles.toLeft}`}
      onClick={() => toggleLayerContainer()}
    >
      {getArrowDir()}
    </button>
  );
};

export default HideLayerButton;
