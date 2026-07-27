// 담당: 피드백/관리자팀

import styles from "../admin.module.css";

type Props = {
  page: number;
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
};

export function Pagination({ page, onPrev, onNext, disableNext }: Props) {
  return (
    <div className={styles.pagination}>
      <button
        type="button"
        className={styles.button}
        onClick={onPrev}
        disabled={page <= 1}
      >
        이전
      </button>
      <span>{page} 페이지</span>
      <button
        type="button"
        className={styles.button}
        onClick={onNext}
        disabled={disableNext}
      >
        다음
      </button>
    </div>
  );
}
