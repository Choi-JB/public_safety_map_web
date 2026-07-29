# 지도 FE 진행 명세서

> **⚠️ 구버전 (아카이브)**  
> 최종 갱신 시점의 계획 문서이며, **현재 코드·진행도는 아래를 본다.**  
> - **현행:** [`docs/웹_FE_진행도_보고서.md`](./웹_FE_진행도_보고서.md)  
> - **인프라↔격자:** [`docs/작업명세_인프라마커_격자분리.md`](./작업명세_인프라마커_격자분리.md)

| 항목 | 내용 |
| :--- | :--- |
| 상태 | 아카이브 — 신규 작업은 위 두 문서 기준 |
| FE 레포 | `public_safety_map_web` |
| BE Base URL (로컬) | `http://localhost:4100` |
| 격자 규약 (현행) | 원점 `(33.0, 124.5)`, 셀 **`0.01°`** (`gridStyle.ts` `CELL`) |
| 안전등급 색 | `안전` / `보통` / `불안` (`gridStyle.ts`) |

---

## 현행 한눈에 (2026-07-29)

| 구분 | 상태 |
| :--- | :---: |
| 카카오맵 · `GET /grids` Polygon | ✅ |
| 격자 on/off · 등급 토글 | ✅ |
| `GET /infrastructures` (중심+반경) · 주변 토글 | ✅ |
| 격자 클릭 → 왼쪽 패널 `/detail` (+ 패널용 인프라 API) | ✅ |
| `GET /city-events` · `GET /reports` | ✅ |
| 검색 / 내 위치 / MapControls | ✅ |
| auth / 제보·피드백 쓰기 | △ / ❌ (보고서 §6) |

### 핵심 파일 (현행)

| 파일 | 역할 |
| :--- | :--- |
| `app/map/page.tsx` | AuthEntry + Panel + Map + Controls |
| `app/map/kakaoMap.tsx` | 맵, 레이어, moveMap |
| `app/map/MapControls.tsx` | 검색·내위치·주변·격자 |
| `app/map/CityEventsPanel.tsx` | 왼쪽 레일+상세 |
| `app/map/infraRange.ts` | level→radius, DEBUG 원 |
| `app/map/gridStyle.ts` | CELL, 등급 색 |
| `store/mapStore.ts` | bounds, 레이어 토글, 패널 상태 |

### 제품 표시 정책 (현행)

```
지도 이동
  → GET /grids
  → GET /city-events, GET /reports
  → GET /infrastructures (center + radius_m)

격자 선택
  → GET /grids/{id}/detail          (패널)
  → GET /grids/{id}/infrastructures (패널 집계만)

제보 쓰기
  → JWT 필요 → 후순위
```

---

## 아래는 초기 계획 원문 (참고용, 수치·체크리스트는 구식)

<details>
<summary>펼치기 — 초기 feature/map-grid 시점 명세</summary>

### 담당·폴더

지도표시: `app/map/*`, `store/mapStore.ts`  
공통: `lib/api/*`, auth  
제외: 피드백 게시판, 관리자, shelters, device/push

### 초기 브랜치 계획 (완료·폐기 혼재)

| 브랜치 | 당시 계획 |
| :--- | :--- |
| `feature/map-grid` | 지도 + `/grids` |
| `feature/map-infra` | 격자 클릭 → infrastructures 마커 ← **이후 view API로 대체** |
| `feature/map-detail` | 인포카드 ← **CityEventsPanel 격자 탭으로 통합** |
| `feature/map-layers` | city-events / reports |
| `feature/map-auth` | 후순위 |

### 당시 잘못된/구식 표기

- CELL `0.005°` → 현행 **`0.01°`**
- 등급 `"위험"` → 현행 **`"불안"`**
- 격자 클릭 시 지도 인프라 마커 → 현행 **패널만**

</details>

---

## 관련 문서

- [`웹_FE_진행도_보고서.md`](./웹_FE_진행도_보고서.md) ← **팀 싱크용 본문**
- [`작업명세_인프라마커_격자분리.md`](./작업명세_인프라마커_격자분리.md)
- FE `README.md`
- 백엔드 `docs/격자_인프라_진행명세서.md`, `API명세서.md`
