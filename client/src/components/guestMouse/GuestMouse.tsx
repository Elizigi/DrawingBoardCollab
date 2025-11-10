import { canvasScale } from "../../Main";
import styles from "./GuestMouse.module.scss";
interface ConnectedUser {
  name: string;
  position: { x: number; y: number };
  color: string;
}
const GuestMouse = ({ name, position, color }: ConnectedUser) => {
  const canvas = document.querySelector("canvas")!;
  const rect = canvas.getBoundingClientRect();
  const xCanvas =
    (position.x / 100) * rect.width * canvasScale.scale + canvasScale.offsetX;
  const yCanvas =
    (position.y / 100) * rect.height * canvasScale.scale + canvasScale.offsetY;
  const left = rect.left + xCanvas;
  const top = rect.top + yCanvas;

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  if (!rect) return null;
  return (
    <div
      className={styles.guestMouseContainer}
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      <h2
        className={styles.nameOfGuest}
        style={{ backgroundColor: hexToRgba(color, 0.3) }}
      >
        {name}
      </h2>
      <img src="/guestCursor.svg" alt="cursor" />
    </div>
  );
};

export default GuestMouse;
