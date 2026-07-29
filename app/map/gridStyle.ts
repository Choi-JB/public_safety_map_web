const CELL = 0.01
const HALF = CELL / 2

/** 안전등급 (격자 필터·색상 공통) */
export const SAFETY_GRADES = ["안전", "보통", "불안"] as const
export type SafetyGrade = (typeof SAFETY_GRADES)[number]

export function isSafetyGrade(v: string | null): v is SafetyGrade {
  return v === "안전" || v === "보통" || v === "불안"
}

export function gridRectanglePath(lat: number, lng: number) {
  return [
    { lat: lat - HALF, lng: lng - HALF },
    { lat: lat - HALF, lng: lng + HALF },
    { lat: lat + HALF, lng: lng + HALF },
    { lat: lat + HALF, lng: lng - HALF },
  ]
}

export function safetyGradeColor(grade: string | null): string {
  switch (grade) {
    case "안전":
      return "#22c55e"
    case "보통":
      return "#eab308"
    case "불안":
      return "#ef4444"
    default:
      return "#94a3b8"
  }
}
