import { useEffect, useState } from "react";

const ContextMenuMV = () => {
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleCanvasRightClick = (
      e: CustomEvent<{ x: number; y: number }>
    ) => {
      setMenuPos({ x: e.detail.x, y: e.detail.y });
      setMenuOpen(true);
    };
    globalThis.addEventListener(
      "canvas-rightclick",
      handleCanvasRightClick as EventListener
    );
    return () =>
      globalThis.removeEventListener(
        "canvas-rightclick",
        handleCanvasRightClick as EventListener
      );
  }, []);

  return { menuPos, menuOpen };
};

export default ContextMenuMV;
