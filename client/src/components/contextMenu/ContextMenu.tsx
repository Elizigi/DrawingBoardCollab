import styles from "./ContextMenu.module.scss";
import ContextMenuMV from "./ContextMenuMV";

const ContextMenu = () => {
  const { menuPos, menuOpen } = ContextMenuMV();
  return (
    <>
      {menuOpen && (
        <div
          style={{ top: menuPos.y, left: menuPos.x }}
          className={styles.contextMenuContainer}
        >
          <button>Save As PNG</button>
          <button>Save As JSON</button>
        </div>
      )}
    </>
  );
};

export default ContextMenu;
