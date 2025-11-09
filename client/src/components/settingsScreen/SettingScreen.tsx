import style from "./SettingScreen.module.scss";
import SettingScreenMV from "./SettingScreenMV";

const SettingScreen = () => {
  const { canvasSizeValue, modalOpen, setCanvasSize, setCanvasSizeValue } =
    SettingScreenMV();
  return (
    <>
      {modalOpen && (
        <div className={style.openingContainer}>
          <div className={style.openingBackground}></div>
          <div className={style.openingModal}>
            <div className={style.inputContainer}>
              <h2>Canvas Size:</h2>
              <input
                onChange={(e) =>
                  setCanvasSizeValue({
                    ...canvasSizeValue,
                    height: Number(e.target.value),
                  })
                }
                type="number"
                value={canvasSizeValue.height}
                placeholder={`${canvasSizeValue.height}`}
              />
              <h2>px X </h2>
              <input
                type="number"
                onChange={(e) =>
                  setCanvasSizeValue({
                    ...canvasSizeValue,
                    width: Number(e.target.value),
                  })
                }
                value={canvasSizeValue.width}
                placeholder={`${canvasSizeValue.width}`}
              />
              <h2>px</h2>
            </div>
            <button onClick={setCanvasSize}>OKAY!</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingScreen;
