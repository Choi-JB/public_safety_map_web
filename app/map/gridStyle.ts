const CELL = 0.01
const HALF = CELL / 2;

export function gridRectanglePath(lat: number, lng: number) {
  return [
    { lat: lat - HALF, lng: lng - HALF },
    { lat: lat - HALF, lng: lng + HALF },
    { lat: lat + HALF, lng: lng + HALF },
    { lat: lat + HALF, lng: lng - HALF },
  ];
}

export function safetyGradeColor(grade: string | null): string {
  switch (grade) {
    case "안전":
      return "#22c55e";
    case "보통":
      return "#eab308";
    case "위험":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}