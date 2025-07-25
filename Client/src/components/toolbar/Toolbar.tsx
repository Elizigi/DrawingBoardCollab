import React, { useState } from "react";
import { useBrushStore } from "../../zustand/useBrushStore";
import styles from "./Toolbar.module.scss";
import OnlineComponent from "../onlineComponent/OnlineComponent";

export const Toolbar = () => {
  const brushColor = useBrushStore((state) => state.brushColor);
  const brushSize = useBrushStore((state) => state.brushSize);

  const activeLayerId = useBrushStore((state) => state.activeLayerId);
  const setActiveLayer = useBrushStore((state) => state.setActiveLayer);

  const allLayers = useBrushStore((state) => state.layers);
  const toggleLayer = useBrushStore((state) => state.toggleLayer);
  const addLayer = useBrushStore((state) => state.addLayer);

  const setBrushColor = useBrushStore((state) => state.setBrushColor);
  const setBrushSize = useBrushStore((state) => state.setBrushSize);

  const usedColors = useBrushStore((state) => state.usedColors);

  const [newLayerName, setNewLayerName] = useState("");
  function changeColor(_: number, e: React.ChangeEvent<HTMLInputElement>) {
    const newColor = parseInt(e.target.value.slice(1), 16);
    setBrushColor(newColor);
  }
  const updateText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLayerName(e.target.value);
  };
  const addNewLayer = () => {
    if (newLayerName.trim().length < 2) return;
    addLayer(newLayerName);
    setNewLayerName("");
  };
  const changeVisible = (id: string) => {
    toggleLayer(id);
  };
  const changeLayer = (id: string) => {
    setActiveLayer(id);
  };
  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.mainToolContainer}>
          <input
            type="color"
            className={styles.currentColorBox}
            value={`#${brushColor.toString(16).padStart(6, "0")}`}
            onChange={(e) => changeColor(brushColor, e)}
          />
          <input
            type="range"
            min={1}
            max={100}
            className={styles.currentWidthSlider}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>
        <div className={styles.toolContainer}>
          {usedColors.map((color, index) =>
            color !== null ? (
              <button
                key={`${color}-${index}`}
                className={styles.colorBox}
                style={{
                  backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
                }}
                onClick={() => setBrushColor(color)}
              ></button>
            ) : (
              <button
                key={`empty-${-index}`}
                className={styles.colorBox}
                style={{
                  backgroundColor: `#5b5a5a`,
                }}
              ></button>
            )
          )}
        </div>
          <OnlineComponent />
        <div className={styles.layerContainer}>
          <div className={styles.addNewLayer}>
            <button className={styles.plusBTN} onClick={addNewLayer}>
              +
            </button>
            <input
              type="text"
              value={newLayerName}
              onChange={updateText}
              className={styles.layerNameInput}
            />
          </div>
          {allLayers
            .slice()
            .reverse()
            .map((layer) => (
              <button
                onClick={() => changeLayer(layer.id)}
                key={layer.id}
                className={`${styles.layer} ${layer.id === activeLayerId ? styles.backGReen : ""}`}
              >
                <div className={styles.visibilityIcon}></div>
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => changeVisible(layer.id)}
                />

                <div className={styles.layerBox}></div>
                <div className={styles.layerNameContainer}>
                  <h5 className={styles.layerName}>{layer.name}</h5>
                </div>
                <div></div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
