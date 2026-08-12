// 담당: 피드백/관리자팀

import styles from "../admin.module.css";

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
};

/** 회색 placeholder 블록 하나 */
export function Skeleton({ width = "100%", height = 14, className }: SkeletonProps) {
  return (
    <span
      className={[styles.skeleton, className].filter(Boolean).join(" ")}
      style={{ width, height }}
      aria-hidden
    />
  );
}

type SkeletonTableRowsProps = {
  rows?: number;
  columns: number;
};

/** 표 로딩 중 보여줄 스켈레톤 행들 */
export function SkeletonTableRows({ rows = 5, columns }: SkeletonTableRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex}>
              <Skeleton height={14} width={colIndex === 0 ? "60%" : "80%"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
