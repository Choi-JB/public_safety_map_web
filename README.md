# Public Safety Map — Frontend (web)

## (1) 실행 방법

```
1. npm install
2. .env.example을 복사해 .env.local 생성 후 NEXT_PUBLIC_API_BASE_URL 값 채우기 (백엔드 주소, 예: http://localhost:4100)
3. npm run dev
4. http://localhost:3000 접속 확인
```

주요 경로
- 로그인: `http://localhost:3000/login`
- 회원가입: `http://localhost:3000/signup`
- 지도: `http://localhost:3000/map`
- 관리자: `http://localhost:3000/admin`

## (2) 폴더 구조

대표 폴더 주석: `공통` / `제보·피드백·관리자`  
파일 주석: 해당 파일의 용도

```
web/
├── app/
│   ├── layout.tsx                      # 루트 레이아웃 · AuthProvider
│   ├── page.tsx                        # / → /map 리다이렉트
│   ├── login/page.tsx                  # 로그인 페이지
│   ├── signup/page.tsx                 # 회원가입 페이지
│   ├── map/                            # 공통 — 사용자 지도 화면
│   │   ├── page.tsx                    # 지도 페이지 진입점
│   │   ├── kakaoMap.tsx                # 카카오맵 렌더 · 격자/인프라
│   │   ├── loadkakaoMap.ts             # 카카오맵 SDK 로드
│   │   ├── MapControls.tsx             # 검색 · 내 위치 · 주변/격자 토글
│   │   ├── CityEventsPanel.tsx         # 지도 사이드 도시정보/격자 패널
│   │   ├── CityEventsPanel.module.css  # 사이드 패널 스타일
│   │   ├── gridStyle.ts                # 안전등급 색 · 격자 스타일
│   │   ├── infraRange.ts               # 인프라 표시 범위 상수
│   │   └── kakao.d.ts                  # 카카오맵 타입 선언
│   ├── reports/page.tsx                # 제보 페이지 (플레이스홀더)
│   ├── feedbacks/page.tsx              # 피드백 페이지 (플레이스홀더)
│   └── admin/page.tsx                  # 관리자 페이지 진입 · 권한 가드
├── store/
│   ├── authStore.ts                    # 공통 — 로그인/로그아웃 · JWT·세션
│   ├── mapStore.ts                     # 공통 — 지도 bounds · 격자/인프라 상태
│   ├── reportStore.ts                  # 제보 도메인 상태
│   ├── feedbackStore.ts                # 피드백 도메인 상태
│   └── adminStore.ts                   # 제보·피드백·관리자 — 관리자 필터·목록·등록
├── components/
│   ├── shared/                         # 공통
│   │   └── AuthProvider.tsx            # 인증 상태 하이드레이션
│   ├── login/                          # 공통 — 로그인 UI
│   │   ├── AuthEntry.tsx               # 지도 상단 로그인/유저 메뉴 진입
│   │   ├── LoginButton.tsx             # 로그인 버튼
│   │   ├── UserMenu.tsx                # 로그인 유저 메뉴
│   │   ├── LoginShell.tsx              # 로그인 페이지 셸
│   │   ├── LoginForm.tsx               # 로그인 폼
│   │   └── login.module.css            # 로그인/회원가입 공통 스타일
│   ├── signup/                         # 공통 — 회원가입 UI
│   │   ├── SignupShell.tsx             # 회원가입 페이지 셸
│   │   └── SignupForm.tsx              # 회원가입 폼
│   └── admin/                          # 제보·피드백·관리자
│       ├── AdminShell.tsx              # 관리자 레이아웃 · 탭 라우팅
│       ├── admin.module.css            # 관리자 UI 스타일
│       ├── layout/
│       │   ├── AdminTopbar.tsx         # 상단 탭 · 유저 정보
│       │   └── AdminMapPanel.tsx       # 왼쪽 지도 영역
│       ├── panels/
│       │   ├── DashboardPanel.tsx      # 대시보드 요약
│       │   ├── ReportsPanel.tsx        # 제보 목록 · 필터 · 삭제/복구
│       │   ├── FeedbacksPanel.tsx      # 피드백 목록 · 필터 · 삭제
│       │   ├── CityEventsPanel.tsx     # 도시정보 목록 · 상태/기간 필터
│       │   └── markers/
│       │       ├── MarkersPanel.tsx    # 마커 등록 탭 전환
│       │       ├── ReportMarkerForm.tsx      # 제보 마커 등록 폼
│       │       └── CityEventMarkerForm.tsx   # 도시정보 마커 등록 폼
│       ├── modals/
│       │   ├── DeleteConfirmModal.tsx  # 삭제 확인
│       │   ├── RestoreConfirmModal.tsx # 복구 확인
│       │   ├── ImagePreviewModal.tsx   # 첨부 이미지 크게 보기
│       │   ├── CityEventModal.tsx      # 도시정보 상세/수정
│       │   └── DetailModals.tsx        # 제보·피드백 상세
│       └── shared/
│           ├── AdminMap.tsx            # 관리자용 카카오맵
│           ├── FilterChecks.tsx        # 기간 프리셋 · 활성여부 체크
│           ├── SearchQueryField.tsx    # 유저(닉네임)/키워드 검색 입력
│           ├── AuthorNicknameMenu.tsx  # 작성자 닉네임 · 작성글 검색 메뉴
│           ├── Pagination.tsx          # 목록 페이지네이션
│           ├── MapMoveButton.tsx       # 목록 → 지도 포커스 이동
│           ├── SafetyBadge.tsx         # 체감안전도 배지
│           ├── formatDate.ts           # 날짜 표시 포맷
│           ├── ScheduleRow.tsx         # 날짜/시간 입력 · DateInput
│           ├── ImageAttachField.tsx    # 이미지 첨부 · 리사이즈 미리보기
│           ├── CloseIcon.tsx
│           ├── RefreshIcon.tsx
│           ├── RestoreIcon.tsx
│           ├── BackIcon.tsx
│           └── TrashIcon.tsx
├── lib/
│   ├── api/                            # 공통 — API 클라이언트
│   │   ├── client.ts                   # fetch 래퍼 · 토큰 갱신
│   │   ├── types.ts                    # 공통 응답/도메인 타입
│   │   ├── auth.ts                     # 로그인 · 회원가입 · 로그아웃 API
│   │   ├── admin.ts                    # 관리자 목록/등록/삭제/복구 API
│   │   └── upload.ts                   # 이미지 업로드 API
│   └── utils/
│       └── imageResize.ts              # 업로드 전 이미지 리사이즈
├── .env.example
├── .gitignore
├── next.config.ts
├── tsconfig.json
├── README.md
└── package.json
```

## (3) 협업 규칙

- `공통` 영역(`app/layout.tsx`, `lib/api/client.ts`, `lib/api/types.ts`, `lib/api/auth.ts`, `store/authStore.ts`, `components/shared` 등) 수정이 필요하면 관련 작업자와 먼저 맞춰 주세요.
- 관리자 UI·API(`components/admin`, `store/adminStore.ts`, `lib/api/admin.ts`)는 제보·피드백·관리자 기능과 함께 변경되는 경우가 많습니다.
