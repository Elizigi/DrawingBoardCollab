import styles from "./GuestMouse.module.scss";
interface ConnectedUser {
  name: string;
  position: { x: number; y: number };
}
const GuestMouse = ({ name, position }: ConnectedUser) => {
  
  return (
    <div
      className={styles.guestMouseContainer}
      style={{ top: position.y, left: position.x }}
    >
      <h2 className={styles.nameOfGuest}>{name}</h2>
      <img src="/guestCursor.svg" alt="cursor" />
    </div>
  );
};

export default GuestMouse;
