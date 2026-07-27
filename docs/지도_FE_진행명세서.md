# 지도 FE 진행 명세서

| 항목 | 내용 |
| :--- | :--- |
| 기준 문서 | 백엔드 `docs/격자_인프라_진행명세서.md`, `docs/API명세서.md`, `docs/기능명세서_v1.2.md` |
| 작성 목적 | **완료된 부분**과 **앞으로 할 부분**을 한곳에 정리 |
| FE 레포 | `public_safety_map_web` |
| BE Base URL (로컬) | `http://localhost:4100` (`/api` 접두 없음) |
| 응답 공통 | `{ "success": true/false, "data": ... }` |
| 격자 규약 (BE·FE 일치) | 원점 `(33.0, 124.5)`, 셀 **`0.005°`** |
| 대상 | **웹만** (앱 device/push 제외) |
| auth | **후순위** (로그인·제보 쓰기 미착수) |

---

## 0. 담당·폴더 범위

### 지도표시팀 (본 명세 주 대상)

| 경로 | 비고 |
| :--- | :--- |
| `app/map/*` | 페이지·카카오맵·격자 스타일·SDK 로드 |
| `store/mapStore.ts` | bounds, grids, (예정) 선택 격자·인프라 |

### 공통기반 (협의 후 수정)

| 경로 | 비고 |
| :--- | :--- |
| `lib/api/client.ts` | `get` / `post` / `patch` / `del` |
| `lib/api/types.ts` | DTO 타입 |
| `app/layout.tsx`, `store/authStore.ts` | auth·레이아웃 |
| `components/ui`, `components/layout` | 공통 UI |

### 제외·타팀

| 항목 | 비고 |
| :--- | :--- |
| FN-03 피드백 게시판 | 피드백팀 |
| FN-05 관리자 | 관리자팀 |
| `/shelters` | 보류 → infrastructures(경찰서·소방서)로 대체 |
| device/push, 이미지 업로드 | 앱·협의 |

**규칙:** README — 담당 외 파일 임의 수정 금지. `lib/api`는 공통이지만 격자 FE 연동을 위해 최소 `get`·타입은 함께 진행함.

---

## 1. 전체 상태 요약

| 구분 | 상태 |
| :--- | :---: |
| 환경 (`.env.local`, API 4100, 카카오 JS 키) | ✅ |
| 카카오맵 표시 | ✅ |
| viewport bounds → `mapStore` | ✅ |
| `lib/api` `get` + `{success,data}` | ✅ |
| `GET /grids` → Polygon 오버레이 | ✅ (실측 UI 확인) |
| 브랜치 `feature/map-grid` 커밋 | ✅ `2936c76` |
| 격자 클릭 → infrastructures 마커 | ❌ 다음 (`feature/map-infra`) |
| 인포카드 `GET /grids/{id}/detail` | ❌ |
| `GET /city-events` 레이어 | ❌ |
| `GET /reports` 제보 마커 (조회만) | ❌ |
| risk_pipeline 점수 (`safety_strength`) | ❌ BE·규약 합의 후 |
| auth / 제보 CRUD | ❌ 후순위 |

---

## 2. 완료된 작업

### 2.1 브랜치·커밋

| 브랜치 | 커밋 | 내용 |
| :--- | :--- | :--- |
| `feature/map-grid` | `2936c76` | 카카오맵 + viewport 격자 (`/grids`) |
| `feature/map-infra` | (현재 작업 브랜치) | `map-grid`에서 분기. 인프라 마커 예정 |

푸시: 필수는 아님. PR·원격 백업 시 `git push -u origin <map-grid>`.

### 2.2 구현 파일

| 파일 | 역할 |
| :--- | :--- |
| `app/map/page.tsx` | `<KakaoMap />` |
| `app/map/kakaoMap.tsx` | 맵 생성, idle→bounds, `/grids`→Polygon |
| `app/map/loadkakaoMap.ts` | 카카오 SDK 로드 (`NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`) |
| `app/map/gridStyle.ts` | `CELL=0.005`, `safetyGradeColor` |
| `app/map/kakao.d.ts` | `window.kakao` |
| `store/mapStore.ts` | `bounds`, `grids`, `gridsLoading` |
| `lib/api/client.ts` | HTTP 클라이언트 (`data` unwrap) |
| `lib/api/types.ts` | `GridBoundsQuery`, `GridItem` |
| `.gitignore` | `.env*` 무시 (`.env.local` 커밋 금지) |

### 2.3 동작 플로우 (완료)

```
지도 표시
  → idle / 디바운스(300ms)
  → setBounds(sw_lat, sw_lng, ne_lat, ne_lng)
  → GET /grids?...
  → Polygon (safety_grade 색: 안전=초록, 보통=노랑, 위험=빨강)
```

### 2.4 실측 확인

- BE `GET /grids?...` → `success: true`, `data` 배열 (서울 시청 일대 등)
- FE `/map`에서 격자 색 오버레이 확인
- hydration 경고: 브라우저 확장(`bis_register` 등) 원인 → 코드 이슈 아님

### 2.5 환경 변수 (로컬, 커밋 금지)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4100
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=...
KAKAO_REST_API_KEY=...   # 1차 지도에는 미사용, NEXT_PUBLIC_ 붙이지 말 것
```

---

## 3. 앞으로 할 부분 (우선순위)

### P1 — 격자 클릭 → 인프라 마커 (`feature/map-infra`)

| 단계 | 내용 | API |
| :--- | :--- | :--- |
| 타입 | `InfraType`, `InfrastructureItem` | — |
| 스토어 | `selectedGridId`, `infraType`, `infrastructures` | — |
| UI | Polygon click → Marker, 타입 필터 버튼 | `GET /grids/{id}/infrastructures?type=` |

- `type`: `CCTV` \| `경찰서` \| `소방서` \| `편의점` (없으면 전체)
- `/shelters` 사용 안 함

### P2 — 인포카드

| 단계 | API |
| :--- | :--- |
| 선택 격자 상세 패널 | `GET /grids/{id}/detail` |

### P3 — 조회 레이어 (🔓만)

| 단계 | API |
| :--- | :--- |
| 도시정보 | `GET /city-events` |
| 제보 마커 | `GET /reports` (등록·수정·삭제 UI 없음) |

### P4 — risk_pipeline 점수 오버레이 (BE 선행)

| 전제 | 내용 |
| :--- | :--- |
| 격자 규약 | **현재 BE·FE = 0.005°**. 파이프라인은 0.01° → **통일 합의 필수** |
| 산출물 | `grid_safety_scores.csv`의 `safety_strength` 등 (joblib은 선택·참고용) |
| 연동 | 점수를 DB 적재 후 **`GET /grids` 응답에 필드 추가** → FE Polygon 색을 strength 기준으로 교체 |
| 시점 | P1~P3 이후. 지금 FE는 `safety_grade`만 사용 |

### P5 — 후순위

- `POST /auth/register`, `POST /auth/login`
- 제보 POST / PATCH / DELETE
- auth JWT 헤더 (`client.ts`)

---

## 4. 제품 표시 정책 (합의 · 백엔드 명세와 동일)

```
지도 이동
  → GET /grids
  → (이후) GET /city-events, GET /reports

격자 선택
  → GET /grids/{id}/infrastructures?type=
  → (선택) GET /grids/{id}/detail

제보 쓰기
  → JWT 필요 → 후순위
```

런타임에 CSV/joblib 직접 로드하지 않음. **DB + API만.**

---

## 5. 브랜치 전략

| 브랜치 | 범위 |
| :--- | :--- |
| `feature/map-grid` | ✅ 지도 + `/grids` 격자 |
| `feature/map-infra` | 격자 클릭 + infrastructures |
| `feature/map-detail` | (선택) 인포카드 |
| `feature/map-layers` | (선택) city-events + reports 조회 |
| `feature/map-auth` | 후순위 |

---

## 6. 체크리스트

### 완료

- [x] `.env.local` (로컬) + API 4100
- [x] 카카오맵 SDK 로드·지도 표시
- [x] bounds → mapStore
- [x] `lib/api` get + Grid 타입
- [x] `GET /grids` Polygon (`CELL=0.005`)
- [x] `feature/map-grid` 커밋 (`2936c76`)
- [x] `feature/map-infra` 브랜치 생성

### 할 일

- [ ] infrastructures 타입·스토어·클릭·마커·필터
- [ ] `/detail` 인포카드
- [ ] city-events / reports 조회 레이어
- [ ] (합의 후) safety_strength → `/grids` → FE 색
- [ ] (후순위) auth · 제보 쓰기

### 보류·제외

- [ ] `GET /shelters`
- [ ] 파이프라인 0.01 규약 미통일 상태에서의 점수 join
- [ ] 이미지 업로드, device/push

---

## 7. 관련 문서

- 백엔드 `docs/격자_인프라_진행명세서.md`
- 백엔드 `docs/API명세서.md`
- 백엔드 `docs/기능명세서_v1.2.md`
- FE `README.md` (폴더·담당 규칙)
