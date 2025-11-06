import styles from "./ContextMenu.module.scss";
import ContextMenuMV from "./ContextMenuMV";

const ContextMenu = () => {
  const { menuPos, menuOpen, saveAsJson, saveAsPng, loadImage } =
    ContextMenuMV();
  return (
    <>
      {menuOpen && (
        <div
          style={{ top: menuPos.y, left: menuPos.x }}
          className={styles.contextMenuContainer}
        >
          <button onClick={saveAsPng}>Save As PNG</button>
          <button onClick={saveAsJson}>Save As JSON</button>
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) loadImage(file);
              };
              input.click();
            }}
          >
            Load JSON
          </button>{" "}
        </div>
      )}
    </>
  );
};

export default ContextMenu;
