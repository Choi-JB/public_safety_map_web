// 담당: 피드백/관리자팀

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 오늘이면 HH:mm, 아니면 YYYY.MM.DD */
export function formatCreatedAt(value: string) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    if (isSameLocalDay(date, new Date())) {
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
  } catch {
    return value;
  }
}
