// 담당: 피드백/관리자팀

import styles from "../admin.module.css";

type Props = {
  feeling: string;
};

export function SafetyBadge({ feeling }: Props) {
  const cls =
    feeling === "안전"
      ? styles.badgeSafe
      : feeling === "불안"
        ? styles.badgeUnsafe
        : styles.badgeNormal;

  return <span className={`${styles.badge} ${cls}`}>{feeling}</span>;
}
