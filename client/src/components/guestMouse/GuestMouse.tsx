import styles from "./GuestMouse.module.scss";
interface ConnectedUser {
  name: string;
  position: { x: number; y: number };
}
const GuestMouse = ({ name, position }: ConnectedUser) => {
  const canvas = document.querySelector("canvas")!;
  const rect = canvas.getBoundingClientRect();
  const top = rect.top + (position.y / 100) * rect.height;
  const left = rect.left + (position.x / 100) * rect.width;
  return (
    <div
      className={styles.guestMouseContainer}
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      <h2 className={styles.nameOfGuest}>{name}</h2>
      <img src="/guestCursor.svg" alt="cursor" />
    </div>
  );
};

export default GuestMouse;
