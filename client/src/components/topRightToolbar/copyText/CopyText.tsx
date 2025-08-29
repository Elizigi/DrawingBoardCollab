import { FC, useState } from "react";
import styles from "./CopyText.module.scss";

interface CopyTextProps {
  roomId: string;
}
const CopyText: FC<CopyTextProps> = ({ roomId }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <button onClick={handleCopy} className={styles.handleEnd}>
        ⧉
      </button>
      {copied && <span className={styles.textCopied}>Copied!</span>}
    </div>
  );
};
export default CopyText;
