import styles from './EventAlert.module.scss'

const EventAlert = () => {
    const events = ["user joined : subscribe!"]
  return (
    <div className={styles.eventContainer}>
      {events.map(event=>(
        <div key={event} className={styles.eventBar}>{event}</div>
      ))}
    </div>
  )
}

export default EventAlert
