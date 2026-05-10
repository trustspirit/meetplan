# MeetPlan

가능한 시간을 공유하고, 겹치지 않는 1:1 일정을 자동으로 찾아주는 스케줄러.

호스트가 가능 시간을 등록하면 참여자들이 각자 가능한 슬롯을 선택하고, 시스템이 모든 참여자를 최대한 커버하는 비중복 배정 조합을 제안합니다.

---

## 주요 기능

- **이벤트 생성** — 달력에서 날짜를 선택하고 드래그로 시간 슬롯을 페인팅
- **공유 링크** — 참여자는 로그인 없이 링크 하나로 응답 가능 (익명 토큰 기반 수정 지원)
- **가용성 매트릭스** — 참여자×슬롯 교차표로 응답 현황 한눈에 파악
- **자동 배정 제안** — 최대 참여자가 겹치지 않게 배정되는 조합을 자동 계산
- **슬롯 편집** — 이벤트 생성 후에도 시간 슬롯 수정 가능, 영향받는 응답만 선별 정리
- **모바일 최적화** — 터치 드래그 페인팅, 앱바 네비게이션, 스켈레톤 로딩

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | React 18 + TypeScript + Vite + Tailwind CSS |
| 백엔드 | Firebase Cloud Functions (Node 20) |
| 데이터베이스 | Cloud Firestore |
| 인증 | Firebase Authentication (Google) |
| 빌드/패키지 | pnpm workspaces (monorepo) |
| 테스트 | Vitest (단위), Playwright (E2E), Firebase Emulator (rules) |

---

## 프로젝트 구조

```
meetplan/
├── apps/web/          # Vite + React 클라이언트
├── functions/         # Cloud Functions
│   └── src/
│       ├── submitResponse.ts
│       ├── getResponse.ts
│       ├── deleteEvent.ts
│       └── updateEventSlots.ts
├── packages/shared/   # 공유 타입, 검증, 시간 유틸, 매칭 알고리즘
└── tests/rules/       # Firestore 보안 규칙 테스트
```

---

## 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- Firebase CLI: `npm i -g firebase-tools`

### 초기 설정

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# .env.local에 Firebase Web 앱 설정값 입력 + VITE_USE_EMULATOR=true
```

### 로컬 실행

```bash
# 터미널 1 — Firebase 에뮬레이터
firebase emulators:start

# 터미널 2 — 웹 개발 서버
pnpm dev
```

| 주소 | 설명 |
|---|---|
| http://localhost:5173 | 웹 앱 |
| http://localhost:4000 | Firebase Emulator UI |

---

## 테스트

```bash
# 전체 단위 테스트
pnpm test

# E2E (에뮬레이터 + 개발 서버 실행 상태에서)
pnpm --filter web test:e2e

# Firestore 보안 규칙 (에뮬레이터 필요)
pnpm --filter rules-tests test

# Functions 단위 테스트
pnpm --filter functions test
```

---

## 배포

### 최초 설정

1. Firebase Console에서 프로젝트 생성 (Hosting, Firestore, Functions, Authentication 활성화)
2. Authentication → 로그인 방법 → Google 활성화
3. Firestore 위치: `asia-northeast3`
4. `firebase login` → `firebase use --add` → 프로젝트 선택
5. 배포 도메인을 Authentication 승인 도메인 목록에 추가
6. Web 앱 등록 후 설정값을 `apps/web/.env.production`에 저장 (`VITE_USE_EMULATOR=false`)

### 배포 실행

```bash
pnpm deploy
```

내부적으로 `web build → functions build → firebase deploy`를 순서대로 실행합니다.
부분 배포가 필요하면:

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions
```

---

## 주요 흐름 검증

### 참여자 응답 흐름

1. 에뮬레이터 + 개발 서버 실행
2. 호스트로 로그인 → 이벤트 생성 → 결과 페이지에서 공유 링크 복사
3. **다른 브라우저 또는 시크릿 창**에서 공유 링크 접속
4. 이름 + 전화번호 입력 → 슬롯 선택 → 제출
   - 익명 제출: 완료 화면의 수정 링크 저장 → 링크 재접속 시 응답 자동 채워짐
   - 로그인 제출: 같은 계정으로 재접속 시 자동 채워짐
5. Firestore Emulator UI에서 `events/<id>/responses` 서브컬렉션 확인

### 호스트 결과 뷰

1. 참여자 응답 수집 후 호스트로 로그인 → 대시보드 → 이벤트 클릭
2. **가용성 매트릭스** 탭: 참여자×슬롯 교차표, 슬롯별 가능 인원 수
3. **자동 배정 제안** 탭: 비중복 배정 조합 (최대 20개), 미매칭 참여자 표시
4. 마감/다시 열기 토글 — 마감 시 참여자 페이지에 잠금 화면 표시

---

## 보안 검증

| 항목 | 확인 방법 |
|---|---|
| 비소유자 결과 페이지 접근 | 다른 계정으로 `/events/:id/result` 직접 접근 → 대시보드로 리다이렉트 |
| 참여자 응답 교차 조회 방지 | Firestore 규칙 테스트: `pnpm --filter rules-tests test` |
| 잘못된 토큰으로 getResponse | `permission-denied` 반환 확인 |
| 마감된 이벤트 응답 제출 | `event-closed` 반환 확인 |
