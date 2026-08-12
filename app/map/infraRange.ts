/** 카카오 map.getLevel() → 인프라 조회 반경(m) */

export const DEBUG_INFRA_RANGE_CIRCLE = true;

export function levelToRadiusM(level: number): number {
  if (level <= 4) return 500;
  if (level === 5) return 1000;
  if (level === 6) return 1500;
  if (level === 7) return 2500;
  if (level === 8) return 4000;
  return 5000; // ≥ 9
}
