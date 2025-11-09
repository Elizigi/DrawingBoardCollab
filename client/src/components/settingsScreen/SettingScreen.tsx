import style from "./SettingScreen.module.scss";
import SettingScreenMV from "./SettingScreenMV";

const SettingScreen = () => {
  const {
    canvasSizeValue,
    modalOpen,
    maxUsersInRoom,
    noChange,
    setMaxUsersInRoom,
    setModalOpen,
    changSettings,
    setCanvasSizeValue,
  } = SettingScreenMV();
  return (
    <>
      <button className={style.settingIcon} onClick={() => setModalOpen(true)}>
        ⚙
      </button>
      {modalOpen && (
        <div className={style.openingContainer}>
          <div
            aria-label="toolbar"
            className={style.openingBackground}
            onPointerDown={noChange}
          ></div>
          <div className={style.openingModal}>
            <div className={style.form}>
              <h2>Canvas Size:</h2>

              <div className={style.inputContainer}>
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
                <h2>px </h2>
                <h1>X</h1>
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
              <h2>Connected Users limit:</h2>
              <div className={style.inputContainer}>
                <input
                  type="number"
                  max={20}
                  min={2}
                  value={maxUsersInRoom}
                  onChange={(e) => setMaxUsersInRoom(Number(e.target.value))}
                />
                <h2>users</h2>
              </div>
            </div>

            <button onClick={changSettings}>OKAY!</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingScreen;
