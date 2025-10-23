
const HideLayerButtonMV = (toTheRight: boolean, containerVisible: boolean) => {
  const getArrowDir = (): string => {
    if (
      (!toTheRight && containerVisible) ||
      (toTheRight && !containerVisible)
    ) {
      return "↩";
    }
    return "↪";
  };
  return {getArrowDir};
};

export default HideLayerButtonMV;
