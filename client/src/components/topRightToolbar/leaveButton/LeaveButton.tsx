import { FC } from "react";
import styles from "./LeaveButton.module.scss";

interface LeaveButtonProps {
  handleLeaveRoom: () => void;
}
const LeaveButton: FC<LeaveButtonProps> = ({ handleLeaveRoom }) => {
  return (
    <button
      onClick={() => handleLeaveRoom()}
      className={styles.leaveButton}
      style={{ color: "red" }}
    >
      <h2>⎋</h2>
    </button>
  );
};

export default LeaveButton;
