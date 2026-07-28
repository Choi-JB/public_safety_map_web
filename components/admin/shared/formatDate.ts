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
    // Z가 잘못 붙은 KST wall-clock을 그대로 보여 줄 때
    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());
    const hh = pad(date.getUTCHours());
    const mm = pad(date.getUTCMinutes());
    const now = new Date();
    const sameDay =
      y === now.getFullYear() &&
      date.getUTCMonth() === now.getMonth() &&
      date.getUTCDate() === now.getDate();
    // 주의: "오늘" 비교도 wall-clock 기준으로 맞추려면
    // now도 getUTC*가 아니라, 서버와 같은 규칙으로 맞춰야 함
    if (sameDay) return `${hh}:${mm}`;
    return `${y}.${m}.${d}`;
  } catch {
    return value;
  }
}
