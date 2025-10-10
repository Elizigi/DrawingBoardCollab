import { FC } from "react";
import { ConnectedUser } from "../TopRightToolbarVM";
import styles from "./UserList.module.scss";
interface UserListProps {
  connectedUsers: ConnectedUser[];
  menuOpen: boolean;
}
const UserList: FC<UserListProps> = ({ connectedUsers, menuOpen }) => {
  return (
    <>
      {connectedUsers.length > 0 && (
        <div className={`${styles.userList} ${menuOpen ? styles.shown : styles.transparent}`}>
          <h3 style={{color:menuOpen?"black":"transparent"}}>Users in the Room:</h3>
          <div
            className={styles.usersContainer}
          >
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
        </div>
      )}
    </>
  );
};

export default UserList;
