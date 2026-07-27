// 담당: 피드백/관리자팀

import styles from "../admin.module.css";

type Props = {
  onClick: () => void;
  title?: string;
  active?: boolean;
};

export function MapMoveButton({
  onClick,
  title = "지도이동",
  active = false,
}: Props) {
  return (
    <button
      type="button"
      className={`${styles.iconButton} ${active ? styles.iconButtonActive : ""}`}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      ◎
    </button>
  );
}
