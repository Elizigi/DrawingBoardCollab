import { FC } from "react";
import { ConnectedUser } from "../TopRightToolbarVM";
import styles from "./UserList.module.scss";
interface UserListProps {
  connectedUsers: ConnectedUser[];
}
const UserList: FC<UserListProps> = ({ connectedUsers }) => {
  return (
    <>
      {connectedUsers.length > 0 && (
        <div className={styles.userList}>
          <h3>Users in the Room:</h3>
          {connectedUsers.map((user) => (
            <button className={styles.guestIcon} key={user.guestId}>
              <div
                className={styles.userColorIcon}
                style={{ backgroundColor: user.color }}
              ></div>
              {user.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default UserList;
