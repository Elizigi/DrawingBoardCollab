
const HideLayerButtonMV = (toTheRight: boolean, containerVisible: boolean) => {
  const getArrowDir = (): string => {
    if (
      (!toTheRight && containerVisible) ||
      (toTheRight && !containerVisible)
    ) {
      return "/assets/arrowLeft.svg";
    }
    return "/assets/arrowRight.svg";
  };
  return { getArrowDir };
};

export default HideLayerButtonMV;
