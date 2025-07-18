import { useBrushStore } from "../../zustand/useBrushStore";

export const Toolbar = () => {
  const brushColor = useBrushStore((state) => state.brushColor);
  const setBrushColor = useBrushStore((state) => state.setBrushColor);

  return (
    <div>
      <p>Current Color: {brushColor.toString(16)}</p>
      <button onClick={() => setBrushColor(0xff0000)}>Red</button>
      <button onClick={() => setBrushColor(0x0000ff)}>Blue</button>
    </div>
  );
};
