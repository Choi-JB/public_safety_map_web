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

/** 날짜 범위 포맷 2026.07.30(목) ~ 2026.08.05(토) 형식으로 반환 */
/** 년도가 같으면 2026.07.30(목) ~ 08.05(토) 형식으로 반환 */
export function formatDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startYear = startDate.getFullYear();
  const startMonth = pad(startDate.getMonth() + 1);
  const startDay = pad(startDate.getDate());
  const endYear = endDate.getFullYear();
  const endMonth = pad(endDate.getMonth() + 1);
  const endDay = pad(endDate.getDate());
  const startDayOfWeek = getDayOfWeek(startDate);
  //const endDayOfWeek = getDayOfWeek(endDate);
  if (startYear === endYear && startMonth === endMonth && startDay === endDay) {
    return `${startYear}.${startMonth}.${startDay}(${startDayOfWeek})`;
  }
  // if (startYear === endYear && startMonth === endMonth) {
  //   return `${startYear}.${startMonth}.${startDay} ~ ${endMonth}.${endDay}`;
  // }
  if (startYear === endYear) {
    return `${startYear}.${startMonth}.${startDay} ~ ${endMonth}.${endDay}`;
  }
  return `${startYear}.${startMonth}.${startDay} ~ ${endYear}.${endMonth}.${endDay}`;
}

/** 날짜를 요일로 반환 */
export function getDayOfWeek(date: Date) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[date.getDay()];
}
