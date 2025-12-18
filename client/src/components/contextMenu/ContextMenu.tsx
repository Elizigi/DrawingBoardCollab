import { useOnlineStatus } from "../../zustand/useOnlineStatus";
import styles from "./ContextMenu.module.scss";
import ContextMenuMV from "./ContextMenuMV";

const ContextMenu = () => {
  const { menuPos, menuOpen, saveAsJson, saveAsPng, loadImage } =
    ContextMenuMV();
  const { inRoom, isAdmin } = useOnlineStatus.getState();

  return (
    <>
      {menuOpen && (
        <div
          style={{ top: menuPos.y, left: menuPos.x }}
          className={styles.contextMenuContainer}
        >
          <button onClick={saveAsPng}>Save As PNG</button>
          <button onClick={saveAsJson}>Save As JSON</button>
          {inRoom && !isAdmin ? (
            ""
          ) : (
            <button
              onClick={() => {
                if (inRoom && !isAdmin) return;
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json,image/*";
                input.onchange = (e: Event) => {
                  const target = e.target as HTMLInputElement;
                  const file = target.files?.[0];
                  if (file) loadImage(file);
                };
                input.click();
              }}
            >
              Load JSON / Image
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default ContextMenu;
