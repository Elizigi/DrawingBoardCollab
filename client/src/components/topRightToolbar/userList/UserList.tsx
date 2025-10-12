import { FC } from "react";
import { ConnectedUser } from "../TopRightToolbarVM";
import styles from "./UserList.module.scss";
import { onlineStatus, socket } from "../../../Main";
interface UserListProps {
  connectedUsers: ConnectedUser[];
  menuOpen: boolean;
}
const UserList: FC<UserListProps> = ({ connectedUsers, menuOpen }) => {

  const removeUser=(guestId:string)=>{
    socket.emit("remove-user",{guestId})
  }

  return (
    <>
      {connectedUsers.length > 0 && (
        <div
          className={`${styles.userList} ${menuOpen ? styles.shown : styles.transparent}`}
        >
          <h3 style={{ color: menuOpen ? "black" : "transparent" }}>
            Users in the Room:
          </h3>
          <div className={styles.usersContainer}>
            {connectedUsers.map((user) => (
              <div className={styles.guestIcon} key={user.guestId}>
                <div
                  className={styles.userColorIcon}
                  style={{ backgroundColor: user.color }}
                ></div>
               <h2> {user.name}</h2>
                {onlineStatus.isAdmin && menuOpen && <button className={styles.removeUser} onClick={()=>removeUser(user.guestId)}>X</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default UserList;
