import { useBrushStore } from "../../zustand/useBrushStore";
import styles from "./EventAlert.module.scss";

const EventAlert = () => {
  const events = useBrushStore((state) => state.events);

  return (
    <div className={styles.eventContainer}>
      {events.map((event, index) => (
        <div key={`${event.name} ${index}`} className={styles.eventBar}>
          {event.name} {event.eventType}
        </div>
      ))}
    </div>
  );
};

export default EventAlert;
