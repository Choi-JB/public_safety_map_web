# 웹 FE 진행도·방향성·해결 과제 보고서

| 항목 | 내용 |
| :--- | :--- |
| 대상 레포 | `public_safety_map_web` |
| 조사 기준일 | 2026-07-29 (문서 최신화) |
| 연동 BE | `public_safety_map_backend` (`http://localhost:4100`) |
| 작성 목적 | 전체 진행도, 제품 방향, 미해결 이슈를 한곳에 정리 |
| 관련 명세 | `docs/작업명세_인프라마커_격자분리.md` |

---

## 1. 요약

웹 FE는 **조회형 지도 핵심 플로우**(카카오맵 · 격자 · view 인프라 · 왼쪽 사이드 패널 · 도시행사 · 제보 마커)와 **로그인·관리자 대시보드**까지 동작 가능한 수준이다.

남은 과제는 크게 두 갈래다.

1. **미착수 제품 화면** — 유저 제보/피드백 쓰기(app), 회원가입
2. **품질·마무리** — 인프라 DEBUG 원 제거, JWT refresh, 소 UX

한 줄 평가:

> 지도 조회·레이어 토글·관리자 골격은 완성 단계이며, 다음 우선순위는 **제보/피드백 쓰기 UX → auth 완성**이다.

---

## 2. 기술 스택·구조

### 2.1 스택

| 항목 | 내용 |
| :--- | :--- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| 상태 | Zustand 5 (`authStore` persist 포함) |
| 지도 | Kakao Maps JS SDK (`libraries=services`) |
| HTTP | `fetch` (`lib/api/client.ts`, admin은 별도 fetch) |
| 스타일 | CSS Modules(login/admin/패널) + 지도·컨트롤 인라인 style |

### 2.2 핵심 디렉터리

```
app/
  map/          # 카카오맵, 격자, MapControls, CityEventsPanel, infraRange
  login/        # 로그인
  admin/        # 관리자 셸
  reports/      # 스텁
  feedbacks/    # 스텁
store/          # auth, map, admin, report(stub), feedback(stub)
lib/api/        # client, types, auth, admin
components/     # login, admin, shared
docs/           # FE 진행 문서
```

### 2.3 `/map` 조합 (`page.tsx`)

| 컴포넌트 | 역할 |
| :--- | :--- |
| `AuthEntry` | 우상단 로그인/유저메뉴 |
| `CityEventsPanel` | 왼쪽 레일(격자/행사) + 슬라이드 상세 |
| `KakaoMap` | 지도·마커·폴리곤·데이터 로딩 |
| `MapControls` | 검색 / 내 위치 / 주변 / 격자 칩 |

### 2.4 실행

```bash
npm install
# .env.example → .env.local
npm run dev   # http://localhost:3000 → /map
```

필수 env:

- `NEXT_PUBLIC_API_BASE_URL` (예: `http://localhost:4100`)
- `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY`

---

## 3. 전체 진행도

### 3.1 기능 매트릭스

| 기능 | 상태 | 근거 |
| :--- | :---: | :--- |
| 환경·카카오맵 표시 | ✅ | `loadkakaoMap.ts`, `kakaoMap.tsx` |
| viewport → `GET /grids` Polygon | ✅ | `kakaoMap.tsx`, `CELL=0.01` |
| 격자 표시 on/off · 등급(안전/보통/불안) 토글 | ✅ | `MapControls`, `gridsVisible` / `visibleGrades` |
| 격자 클릭 → 왼쪽 패널 상세 (`/detail`) | ✅ | `CityEventsPanel` 격자 탭 |
| view 인프라 `GET /infrastructures` (중심+반경) | ✅ | `kakaoMap`, `infraRange.ts` |
| 주변 표시 on/off · 타입 토글 | ✅ | `infraVisible` / `visibleInfraTypes` |
| 패널 격자 인프라 집계 (`/grids/:id/infrastructures`) | ✅ | 지도 마커와 분리 |
| `GET /city-events` 마커 · 왼쪽 행사 탭 | ✅ | `CityEventsPanel`, `kakaoMap` |
| `GET /reports` 제보 마커(조회) | ✅ | `kakaoMap` (InfoWindow 유지) |
| 검색 / 내 위치 | ✅ | `MapControls` (도시 프리셋 제거) |
| 마커 색·인프라 라벨 핀 | ✅ | `createPinImage` |
| 로그인 (JWT/세션) | △ | `/login` 동작, **회원가입 UI 없음** |
| JWT refresh (401 재시도) | ❌ | `refreshAccessToken` 정의만, `request()` 미연결 |
| 관리자 대시보드·제보·피드백·도시행사 | △ | CRUD 상당 부분, **제보형 마커 POST 일부 미구현** |
| 유저 제보 쓰기 (`/reports`) | ❌ | 플레이스홀더만 |
| 피드백 게시판 (`/feedbacks`) | ❌ | 플레이스홀더만 |
| `safety_strength` 점수 오버레이 | ❌ | 등급 색만 사용 |
| `/shelters`, device/push, 이미지 업로드 | 보류 | 팀 합의·명세 제외 |

### 3.2 진행률(대략)

| 영역 | 진행률 | 설명 |
| :--- | ---: | :--- |
| 지도 조회 UX | ~95% | API·토글·패널 완료, DEBUG 원·소 UX 잔여 |
| 인증 | ~60% | 로그인·persist·관리자 세션 OK, 회원가입·refresh 미완 |
| 관리자 | ~75% | 패널·모달 구현, markers POST 일부 미구현 |
| 유저 제보/피드백 | ~5% | 페이지 스텁 |
| 문서 | ~80% | 본 보고서·인프라 작업명세 갱신 |

---

## 4. 현재 제품 플로우 (동작하는 것)

```
/ → /map
  → 카카오맵 로드 (기본 서울시청, GPS 허용 시 현재 위치 + 파란 핀)
  → 왼쪽: 레일만 (sidePanelOpen 초기 false) — 클릭 시 상세 슬라이드
  → MapControls: 검색 / 내 위치 / 주변 / 격자
  → idle + 300ms debounce → setBounds
      → GET /grids              → safety_grade Polygon (표시·등급 필터)
      → GET /city-events        → 분홍 행사 마커
      → GET /reports            → 붉은 제보 마커 (+ InfoWindow)
      → GET /infrastructures    → 중심+반경, 타입 토글 후 마커
  → Polygon 클릭
      → 왼쪽 패널 격자 탭 + GET /grids/{id}/detail
      → (패널용) GET /grids/{id}/infrastructures — 개수·목록만, 지도 마커와 무관
  → 행사 패널 항목 클릭 → moveTo(level≈4~5) + 하이라이트
  → AuthEntry /admin
```

미동작·스텁 경로:

- `/reports` — “여기는 제보 페이지입니다”
- `/feedbacks` — “여기는 피드백 페이지입니다”

---

## 5. 방향성

### 5.1 제품 방향 (표시 정책)

1. **지도 중심** — bounds로 격자·도시정보·제보 표시
2. **인프라** — **view(중심+반경)** 기준 마커. 격자 선택은 상세·집계만
3. **레이어 토글** — 격자(등급), 주변(타입) 각각 on/off
4. **제보 등록은 일반 유저** — 패널/지도 내 폼 예정
5. **런타임 CSV 미사용** — DB + API만
6. **웹만** — device/push·앱 제외

### 5.2 권장 로드맵

| 순위 | 과제 | 이유 |
| :---: | :--- | :--- |
| P1 | 유저 제보 쓰기 UI (패널 연계) | BE CRUD 준비됨, 제품 핵심 루프 |
| P1 | city-events ↔ 관리자 필드·날짜 정합 | BE도 후속으로 명시 |
| P2 | 회원가입 / JWT refresh 연결 | auth 완성도 |
| P2 | 피드백 게시판 UI | 웹 완결성 |
| P2 | `DEBUG_INFRA_RANGE_CIRCLE` off | QA 종료 후 |
| P3 | Admin `POST /admin/markers` | 관리자 마커 등록 완결 |
| P3 | `safety_strength` 점수색 (선택) | BE 배치·합의 후 |

---

## 6. 해결해야 할 점

### 6.1 정합·품질

| 항목 | 상태 |
| :--- | :--- |
| `safety_grade` 색 (`안전`/`보통`/`불안`) | ✅ `gridStyle.ts` BE와 일치 |
| 격자 CELL | ✅ FE·BE `0.01°` |
| CityEventsPanel 임박/진행 배지 | 점검 권장 (조건 겹침 가능) |
| 인프라 DEBUG 원 | `DEBUG_INFRA_RANGE_CIRCLE=true`, stroke만·fill 없음 — QA 후 off |

### 6.2 미구현 기능

| 항목 | 현황 | 비고 |
| :--- | :--- | :--- |
| `/reports` 페이지·`reportStore` | 스텁 | 제보/알림팀 · app |
| `/feedbacks` 페이지·`feedbackStore` | 스텁 | 피드백팀 |
| 회원가입 UI | 없음 | BE `POST /auth/register` 존재 |
| JWT refresh on 401 | dead code | `client.ts`에 정의만 |
| Admin 제보형 마커 POST | 미구현 안내 | `MarkersPanel.tsx` |
| 이미지 업로드 | 보류 | 1차 데모 후 |
| `safety_strength` 오버레이 | 미착수 | BE 점수 공개·합의 후 |

### 6.3 품질·구조 부채

| 항목 | 설명 |
| :--- | :--- |
| `docs/지도_FE_진행명세서.md` | **구버전** — 상단 안내 후 본 보고서·인프라 명세 참조 |
| `lib/api/admin.ts` | 공통 `client` 미사용 |
| `components/ui`, `components/layout` | 빈 폴더 |
| 로그인 후 리다이렉트 | 관리자도 `/map` 고정 (admin 분기 주석) |

### 6.4 BE 연동 메모

| 항목 | 상태 |
| :--- | :--- |
| `GET /grids` · detail | FE 연동 완료 |
| `GET /infrastructures` (중심+반경) | FE 연동 완료 |
| `GET /grids/:id/infrastructures` | 패널 집계용 유지 |
| `GET /city-events` | FE 연동. BE `is_active=Y` |
| `GET /reports` | bounds 조회 OK |
| `grid.safety_grade` | BE 배치 → FE는 API만 |

---

## 7. 팀별 담당·경계

| 팀 | FE 경로 | 상태 |
| :--- | :--- | :--- |
| 지도표시 | `app/map/*`, `store/mapStore.ts` | 핵심 완료 |
| 공통기반 | `lib/api/client|types|auth`, `authStore` | 로그인 골격, refresh 미완 |
| 제보/알림 | `app/reports`, `reportStore` | 스텁 |
| 피드백/관리자 | `app/feedbacks`, `app/admin`, `components/admin` | 관리자 강함, 피드백 스텁 |

협업 규칙: 담당 외 폴더 임의 수정 금지. 공통 API/auth 변경은 공통기반과 합의.

---

## 8. 권장 다음 행동 (체크리스트)

### 즉시·단기

- [ ] 패널/지도 제보 등록 폼 스펙 확정 → 구현
- [ ] city-events 관리자 ↔ 지도 패널 필드 대조
- [ ] DEBUG 인프라 원 플래그 off
- [ ] 현재 지도 UX 브랜치 PR → `dev` 병합 여부

### 중기

- [ ] 회원가입, JWT refresh 연결
- [ ] `/feedbacks` 게시판
- [ ] Admin markers API
- [ ] (선택) `safety_strength` 오버레이

---

## 9. 관련 문서

| 문서 | 위치 | 비고 |
| :--- | :--- | :--- |
| 본 보고서 | `docs/웹_FE_진행도_보고서.md` | **현행 기준** |
| 인프라↔격자 분리 | `docs/작업명세_인프라마커_격자분리.md` | FE 구현 반영 |
| FE 진행명세 (구버전) | `docs/지도_FE_진행명세서.md` | 아카이브·참조용 |
| FE README | `README.md` | 실행·폴더·담당 |
| BE 명세 | backend `docs/` | API·제품 정책 |

---

## 10. 결론

웹 FE는 **지도 조회 MVP를 넘어 레이어 토글·사이드 패널까지 갖춘 데모·운영 가능 수준**이다.  
인프라·격자는 view/선택 역할이 분리되었고, 등급·타입 토글이 동작한다.

다음 제품 가치는 **제보·피드백 쓰기 UI**와 **auth 완성**에 있다.
