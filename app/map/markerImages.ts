/** 카카오 지도 마커 이미지 (지도 / 관리자 공통) */

export const MARKER_COLORS = {
  me: "#2563eb",
  report: "#dc2626",
  infra: "#16a34a",
  event: "#ec4899",
} as const;

export function infraColor(type: string | null) {
  switch (type) {
    case "CCTV":
      return "#0f766e";
    case "경찰서":
      return "#1d4ed8";
    case "소방서":
      return "#ea580c";
    case "편의점":
      return "#65a30d";
    default:
      return MARKER_COLORS.infra;
  }
}

/** SVG 핀 → 카카오 MarkerImage (label 있으면 흰 원에 글자) */
export function createPinImage(kakao: any, color: string, label?: string) {
  const center = label
    ? `<circle cx="12" cy="12" r="5.5" fill="#fff"/><text x="12" y="15.5" text-anchor="middle" font-size="9" font-weight="700" fill="${color}" font-family="sans-serif">${label}</text>`
    : `<circle cx="12" cy="12" r="4.5" fill="#fff"/>`;

  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35">
      <path fill="${color}" stroke="#fff" stroke-width="1.5"
        d="M12 0C5.4 0 0 5.4 0 12c0 9 12 23 12 23s12-14 12-23C24 5.4 18.6 0 12 0z"/>
      ${center}
    </svg>`
  );

  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${svg}`,
    new kakao.maps.Size(24, 35),
    { offset: new kakao.maps.Point(12, 35) }
  );
}

/** 원형 마커 공통 (내부에 SVG 콘텐츠) */
export function createCircleIconImage(
  kakao: any,
  color: string,
  innerSvg: string,
  size = 22
) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      ${innerSvg}
    </svg>`
  );

  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${svg}`,
    new kakao.maps.Size(size, size),
    { offset: new kakao.maps.Point(size / 2, size / 2) }
  );
}

export function reportColor(type: string | null) {
  switch (type) {
    case "교통사고":
    case "사고":
      return "#dc2626";
    case "싱크홀":
    case "자연재해":
      return "#7c3aed";
    case "공사":
      return "#ea580c";
    case "통제":
      return "#b45309";
    default:
      return MARKER_COLORS.report;
  }
}

/** 교통사고 — 첨부한 충돌 아이콘을 노란 경고 삼각형에 사용 */
function createAccidentTriangleImage(kakao: any) {
  return new kakao.maps.MarkerImage(
    "/markers/accident-warning.png",
    new kakao.maps.Size(40, 38),
    { offset: new kakao.maps.Point(20, 36) }
  );
}

/** 자연재해 — 첨부한 아이콘을 원형 마커에 사용 */
function createDisasterImage(kakao: any) {
  return new kakao.maps.MarkerImage(
    "/markers/disaster-warning.png",
    new kakao.maps.Size(33, 33),
    { offset: new kakao.maps.Point(16.5, 16.5) }
  );
}

export function createReportImage(kakao: any, type: string | null) {
  const color = reportColor(type);
  const stroke =
    'fill="none" stroke="#fff" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"';

  switch (type) {
    case "교통사고":
    case "사고":
      return createAccidentTriangleImage(kakao);
    case "자연재해":
      return createDisasterImage(kakao);
    case "싱크홀":
      return createCircleIconImage(
        kakao,
        color,
        `<g transform="translate(4.8 5)" ${stroke}>
          <path d="M1 3.2h10"/>
          <path d="M2.2 3.2c.4 2.2 1.6 4.8 3.8 4.8s3.4-2.6 3.8-4.8" fill="#fff" fill-opacity="0.2"/>
          <ellipse cx="6" cy="8.6" rx="2.4" ry="1.1" fill="#fff" fill-opacity="0.35"/>
          <path d="M4.2 1.2l1.8 1.6 1.8-1.6"/>
        </g>`
      );
    case "공사":
      return createCircleIconImage(
        kakao,
        color,
        `<g transform="translate(5 4.5)" ${stroke}>
          <path d="M6 1.2L11 10.2H1z" fill="#fff" fill-opacity="0.2"/>
          <path d="M6 1.2L11 10.2H1z"/>
          <path d="M6 4.2v3.2"/>
          <circle cx="6" cy="8.6" r="0.7" fill="#fff" stroke="none"/>
        </g>`
      );
    case "통제":
      return createCircleIconImage(
        kakao,
        color,
        `<g transform="translate(4.5 5)" ${stroke}>
          <path d="M1.5 3.2h10v4.2H1.5z" fill="#fff" fill-opacity="0.2"/>
          <path d="M1.5 3.2h10v4.2H1.5z"/>
          <path d="M2.2 3.2l8.6 4.2M10.8 3.2L2.2 7.4"/>
          <path d="M3 7.4V11M10 7.4V11"/>
        </g>`,
        33
      );
    default:
      return createCircleIconImage(
        kakao,
        color,
        `<g transform="translate(9.2 5)" ${stroke}>
          <path d="M1.8 1.2v6.2" stroke-width="2"/>
          <circle cx="1.8" cy="10" r="1" fill="#fff" stroke="none"/>
        </g>`
      );
  }
}

export function createCctvImage(kakao: any) {
  const color = infraColor("CCTV");
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <g transform="translate(4.2 5.8)" fill="none" stroke="#fff" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <rect x="0.5" y="2.2" width="8.2" height="5.6" rx="1.2" fill="#fff"/>
        <path d="M8.7 3.6l3.2-1.5v6.2l-3.2-1.5" fill="#fff"/>
        <circle cx="4.6" cy="5" r="1.55" fill="${color}" stroke="${color}"/>
        <path d="M2.8 2.2V1.3a1.6 1.6 0 0 1 3.2 0v.9"/>
      </g>
    </svg>`
  );

  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${svg}`,
    new kakao.maps.Size(22, 22),
    { offset: new kakao.maps.Point(11, 11) }
  );
}

export function createCircleTextImage(kakao: any, color: string, text: string) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <text x="11" y="14.2" text-anchor="middle" font-size="8" font-weight="700"
        fill="#fff" font-family="sans-serif">${text}</text>
    </svg>`
  );

  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${svg}`,
    new kakao.maps.Size(22, 22),
    { offset: new kakao.maps.Point(11, 11) }
  );
}

export function createStoreImage(kakao: any) {
  const color = infraColor("편의점");
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <g transform="translate(5 4.8)" fill="none" stroke="#fff" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 4.2L2.2 1.4h7.6L11 4.2" fill="#fff" fill-opacity="0.25"/>
        <path d="M1 4.2h10v1.4H1z" fill="#fff"/>
        <path d="M1.8 5.6V11h8.4V5.6"/>
        <path d="M4.2 11V7.8h3.6V11"/>
        <circle cx="3.2" cy="4.2" r="0.7" fill="#fff" stroke="none"/>
        <circle cx="8.8" cy="4.2" r="0.7" fill="#fff" stroke="none"/>
      </g>
    </svg>`
  );

  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${svg}`,
    new kakao.maps.Size(22, 22),
    { offset: new kakao.maps.Point(11, 11) }
  );
}

export function createInfraImage(kakao: any, type: string | null) {
  switch (type) {
    case "CCTV":
      return createCctvImage(kakao);
    case "경찰서":
      return createCircleTextImage(kakao, infraColor(type), "112");
    case "소방서":
      return createCircleTextImage(kakao, infraColor(type), "119");
    case "편의점":
      return createStoreImage(kakao);
    default:
      return createCircleTextImage(kakao, infraColor(type), "");
  }
}
