# Public Safety Map — Frontend (web)

## (1) 실행 방법

```
1. npm install
2. .env.example을 복사해 .env.local 생성 후 NEXT_PUBLIC_API_BASE_URL 값 채우기 (백엔드 주소, 예: http://localhost:4000)
3. npm run dev
4. http://localhost:3000 접속 확인
```

## (2) 폴더 구조 + 담당 역할

```
web/
├── app/
│   ├── layout.tsx          # 공통기반
│   ├── map/page.tsx        # 지도표시팀
│   ├── reports/page.tsx    # 제보/알림팀
│   ├── feedbacks/page.tsx  # 피드백/관리자팀
│   └── admin/page.tsx      # 피드백/관리자팀
├── store/
│   ├── authStore.ts        # 공통기반
│   ├── mapStore.ts         # 지도표시팀
│   ├── reportStore.ts      # 제보/알림팀
│   ├── feedbackStore.ts    # 피드백/관리자팀
│   └── adminStore.ts       # 피드백/관리자팀
├── components/
│   ├── ui/                 # 공통기반
│   ├── layout/             # 공통기반
│   └── shared/             # 여러 팀 공용 (공통기반 + 필요한 팀 협의)
├── lib/
│   └── api/                # 공통기반
│       ├── client.ts
│       └── types.ts
├── .env.example
├── .gitignore
├── tsconfig.json
├── README.md
└── package.json
```

## (3) 협업 규칙

⚠️ 각자 담당 폴더/파일 외에는 임의로 수정하지 마세요. 공통 파일(app/layout.tsx, lib/api, components/ui, components/layout, authStore.ts 등) 수정이 필요하면 먼저 공통기반 담당자에게 요청하세요.
