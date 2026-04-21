# MeetPlan 배포 가이드

최초 1회 Firebase/GCP 설정부터 GitHub Actions 기반 자동 배포, 그리고 로컬 개발 환경 셋업까지 한 번에 정리.

---

## 1. 최초 1회 — Firebase 프로젝트 준비

### 1-1. 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) → **프로젝트 추가**
2. 프로젝트 이름: `meetplan-prod` (원하는 이름으로. 이하 예시는 `meetplan-prod`)
3. Google Analytics: 선택 사항 (v1에선 미사용해도 OK)

### 1-2. 서비스 활성화

프로젝트 생성 후 각 서비스 최초 1회 활성화:

| 서비스                 | 위치                                                 | 메모                                                                  |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| **Authentication**     | 왼쪽 메뉴 → Authentication → 시작하기                | Sign-in method에서 **Google** 공급자 활성화                           |
| **Firestore Database** | 왼쪽 메뉴 → Firestore Database → 데이터베이스 만들기 | 위치 `asia-northeast3` (서울), Production 모드로 시작                 |
| **Functions**          | 왼쪽 메뉴 → Functions → 시작하기                     | Blaze 요금제 필수 (callable 사용 시). 무료 쿼터 내에서 과금 위험 낮음 |
| **Hosting**            | 왼쪽 메뉴 → Hosting → 시작하기                       | 가이드는 건너뛰어도 됨. Actions에서 배포함                            |

### 1-3. Web 앱 등록

1. 프로젝트 설정(톱니바퀴) → **내 앱** → `</>`(웹) 아이콘
2. 앱 닉네임: `meetplan-web`
3. **Firebase Hosting 설정**: 지금은 체크 해제해도 OK (Actions가 처리)
4. 등록 완료 후 화면에 나오는 `firebaseConfig` 값을 메모:
   ```js
   {
     apiKey: "AIza...",
     authDomain: "meetplan-prod.firebaseapp.com",
     projectId: "meetplan-prod",
     appId: "1:123456789:web:abcdef..."
     // (storageBucket, messagingSenderId는 v1에서 미사용)
   }
   ```
   → 이 네 개 값이 GitHub Secret + 로컬 `.env.local`에 들어감.

### 1-4. Authorized Domains

Authentication → Settings → **Authorized domains**

- 기본으로 `<프로젝트ID>.firebaseapp.com`, `<프로젝트ID>.web.app`, `localhost` 포함
- 커스텀 도메인 쓰면 여기에 추가

### 1-5. Firestore 인덱스 / Rules 배포

Actions가 자동 배포하므로 수동 단계 불필요. 최초 배포 전에는 콘솔에서 "Rules 테스트" 탭으로 인덱스 상태만 확인.

---

## 2. 서비스 계정 (배포용)

자동 배포를 위해 전용 서비스 계정이 필요. Firebase 자동 생성 `firebase-adminsdk-xxx@...`를 쓸 수도 있지만, **최소 권한 전용 deployer 계정**을 추천.

### 2-1. 서비스 계정 생성

1. [GCP Console](https://console.cloud.google.com/) → 해당 프로젝트 선택 → **IAM & Admin → Service Accounts**
2. **CREATE SERVICE ACCOUNT**
   - 이름: `meetplan-deployer`
   - 설명: `Deployer for meetplan via GitHub Actions`
3. **Grant this service account access to project** 단계에서 다음 역할 부여:
   - **Firebase Admin** (Hosting + Firestore Rules + Functions 일괄 관리)
   - **Cloud Functions Admin** (functions 생성/업데이트)
   - **Cloud Datastore Owner** (Firestore 인덱스 배포)
   - **Artifact Registry Writer** (Functions Gen 2 컨테이너 푸시)
   - **Service Account User** (functions가 사용할 런타임 계정으로 권한 위임)
4. 생성 완료

### 2-2. JSON 키 생성

1. 방금 만든 서비스 계정 클릭 → **KEYS** 탭 → **ADD KEY → Create new key** → **JSON** → CREATE
2. 다운로드된 `meetplan-prod-xxxxx.json` 파일을 **안전한 곳**에 보관 (한 번만 다운로드 가능)
3. 파일 **전체 내용**(중괄호 포함 JSON)을 복사 → 곧 GitHub Secret에 넣음

**⚠️ 보안**:

- 이 JSON 파일을 git에 커밋하지 마세요
- 외부에 유출되면 GCP 콘솔에서 즉시 키 revoke
- GitHub 외에는 보관하지 마세요

---

## 3. GitHub Secrets 설정 (자동 배포용)

### 3-1. Repository 시크릿 등록

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

더 안전한 방법: **Environments → New environment: `production`** 에 시크릿을 넣으면 protection rules(수동 승인 등) 적용 가능. `deploy.yml`의 `environment: production` 설정이 이미 되어 있어 environment 시크릿 자동 인식.

### 3-2. 필수 시크릿 목록

| Secret 이름                 | 값                                                                | 출처                            |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT`  | **JSON 파일 전체 내용** (2-2에서 다운받은 파일 열어 `{...}` 전부) | GCP Console → 서비스 계정 키    |
| `FIREBASE_PROJECT_ID`       | `meetplan-prod` (1-1에서 정한 ID)                                 | Firebase Console 프로젝트 개요  |
| `VITE_FIREBASE_API_KEY`     | `AIza...`                                                         | 1-3의 firebaseConfig.apiKey     |
| `VITE_FIREBASE_AUTH_DOMAIN` | `meetplan-prod.firebaseapp.com`                                   | 1-3의 firebaseConfig.authDomain |
| `VITE_FIREBASE_PROJECT_ID`  | `meetplan-prod` (보통 `FIREBASE_PROJECT_ID`와 동일)               | 1-3의 firebaseConfig.projectId  |
| `VITE_FIREBASE_APP_ID`      | `1:123456789:web:abc...`                                          | 1-3의 firebaseConfig.appId      |

**메모**:

- `VITE_FIREBASE_*` 값들은 클라이언트 번들에 embed되므로 "비밀"이 아님 — GitHub Secret에 넣는 건 관리 편의상이지 유출 방지 목적 아님
- 진짜 비밀은 `FIREBASE_SERVICE_ACCOUNT` 하나 (이건 절대 유출 금지)

---

## 4. 자동 배포 흐름 (GitHub Actions)

### 4-1. 파일 구조

```
.github/workflows/
├── deploy.yml    # main 브랜치 push → 자동 배포
└── pr.yml        # PR 생성 → 테스트만 (배포 X)
```

### 4-2. `deploy.yml`이 하는 일

`main` 브랜치에 push 또는 Actions 탭에서 `workflow_dispatch` 수동 트리거 시:

1. **test job**
   - pnpm install (frozen-lockfile)
   - `pnpm -r typecheck` (전 워크스페이스)
   - shared / web / functions 단위 테스트 실행

2. **deploy job** (test 통과 후만)
   - `environment: production` 적용 (approval 설정 가능)
   - pnpm install
   - `apps/web/.env.production`을 secrets로 런타임 생성
   - web build (`pnpm --filter web build`)
   - functions build (`pnpm --filter functions build`)
   - GCP 인증 (`google-github-actions/auth@v2` + 서비스 계정 JSON)
   - Firebase CLI 설치
   - `firebase deploy --project $FIREBASE_PROJECT_ID --force --non-interactive`
     - Hosting (apps/web/dist)
     - Firestore Rules
     - Firestore Indexes
     - Functions (functions/lib)

### 4-3. PR 워크플로

`pr.yml`은 pull_request 이벤트에 반응해 typecheck + tests + build smoke만 실행. 배포 X. merge 차단용 required check로 설정 가능.

### 4-4. 수동 트리거

긴급 재배포 필요 시:

- GitHub repo → **Actions 탭** → **Deploy** workflow → **Run workflow** → `main` 선택

### 4-5. 배포 범위 제한

특정 영역만 배포하고 싶으면 `deploy.yml`의 마지막 `firebase deploy` 커맨드를 다음 중 하나로 교체:

```bash
firebase deploy --only hosting --project $FIREBASE_PROJECT_ID
firebase deploy --only functions --project $FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules --project $FIREBASE_PROJECT_ID
firebase deploy --only firestore:indexes --project $FIREBASE_PROJECT_ID
```

여러 개는 콤마: `--only hosting,functions`.

---

## 5. 로컬 개발 환경 셋업

### 5-1. 요구 사항

- **Node.js 20+**
- **pnpm 9+** (`npm i -g pnpm`)
- **Firebase CLI** (`npm i -g firebase-tools`)
- **Java 11+** (Firestore 에뮬레이터 필요)

### 5-2. 의존성 설치

```bash
cd /path/to/meetplan
pnpm install
```

### 5-3. 로컬 환경 변수 (`apps/web/.env.local`)

```bash
cp apps/web/.env.example apps/web/.env.local
```

`apps/web/.env.local` 내용:

```env
VITE_FIREBASE_API_KEY=<1-3에서 받은 apiKey>
VITE_FIREBASE_AUTH_DOMAIN=<authDomain>
VITE_FIREBASE_PROJECT_ID=<projectId>
VITE_FIREBASE_APP_ID=<appId>
VITE_USE_EMULATOR=true
```

**메모**:

- `VITE_USE_EMULATOR=true`이면 Firebase SDK가 localhost 에뮬레이터에 연결 → 실제 프로젝트 건드리지 않음
- `.env.local`은 `.gitignore`에 포함되어 자동 비추적

### 5-4. 에뮬레이터 + dev 서버 동시 실행

두 개의 터미널:

```bash
# 터미널 1 — 에뮬레이터 (Auth / Firestore / Functions / Hosting 한번에)
firebase emulators:start

# 터미널 2 — Vite 개발 서버
pnpm dev
```

접속:

- **웹 앱**: http://localhost:5173
- **Emulator UI**: http://localhost:4000 (Firestore 데이터, Auth 사용자 관리, Functions 로그 확인)

### 5-5. 로컬에서 Functions 변경 반영

Functions 코드 수정 시 에뮬레이터가 자동 감지하려면 빌드 필요:

```bash
pnpm --filter functions build
```

(에뮬레이터는 `functions/lib/index.js`를 읽음. `watch` 모드로 자동 빌드하고 싶으면 `functions/package.json`의 `build` 스크립트를 `tsc --watch`로 바꿀 수 있음.)

### 5-6. 로컬 테스트

```bash
pnpm test                       # 전 워크스페이스 단위 테스트
pnpm --filter web test:e2e      # E2E (에뮬레이터 + dev 기동 필요)
pnpm --filter rules-tests test  # Firestore 보안 룰 테스트 (에뮬레이터 필요)
```

### 5-7. 로컬에서 production 대상 수동 배포 (예외 케이스)

Actions 없이 로컬에서 직접 배포하려면:

```bash
# 1. 최초 1회
firebase login                       # 브라우저 열려 로그인
firebase use --add                   # 프로젝트 선택 → alias default

# 2. 배포용 .env 준비
cp apps/web/.env.example apps/web/.env.production
# .env.production 편집: VITE_USE_EMULATOR=false, 나머지 프로덕션 값

# 3. 배포
pnpm deploy
# 내부적으로: web build → functions build → firebase deploy
```

**주의**: 가능하면 로컬 배포는 피하고 Actions를 쓸 것. 팀원 간 동기화 문제, 인증 정보 유출 위험이 높음.

---

## 6. 배포 체크리스트

### 첫 배포 전 (한 번만)

- [ ] Firebase 프로젝트 생성 + 서비스 활성화 (§1)
- [ ] Google 로그인 공급자 활성화 (§1-2)
- [ ] Web 앱 등록 + config 4개 값 확보 (§1-3)
- [ ] 서비스 계정 생성 + JSON 키 다운 (§2)
- [ ] GitHub Secrets 6개 등록 (§3-2)
- [ ] `.gitignore`에 `.env.production` 포함 확인 (이미 반영됨)
- [ ] `.firebaserc`의 `default` 프로젝트 ID 확인/수정 (현재는 `meetplan-dev` — 프로덕션 프로젝트 ID로 덮어쓰거나, Actions는 `--project` 플래그로 덮어쓰므로 그대로 둬도 OK)

### 매 배포 시 (자동)

- [ ] `main`에 merge 또는 push
- [ ] Actions 탭에서 `Deploy` 워크플로 진행 상황 확인
- [ ] 완료 시 `https://<projectId>.web.app` 또는 커스텀 도메인 접속해 검증

### 문제 발생 시 롤백

Firebase Hosting은 버전 관리가 있어 콘솔에서 이전 버전으로 바로 rollback 가능:

- Firebase Console → Hosting → **릴리스** 탭 → 이전 버전 옆 **롤백**

Functions는 버전 관리 없음 → 이전 커밋 체크아웃 후 재배포 필요.

---

## 7. 트러블슈팅

### `Error: HTTP Error: 403, The caller does not have permission`

서비스 계정 역할 부족. §2-1의 5개 역할 전부 부여했는지 확인.

### `auth/unauthorized-domain`

`localhost` 또는 배포 도메인이 Authentication Authorized Domains에 없음. §1-4에서 추가.

### 에뮬레이터 기동 시 `Error: listen EADDRINUSE: :::9099`

이전 에뮬레이터 프로세스가 살아있음:

```bash
lsof -ti:9099,8080,5001,5000,4000 | xargs kill -9
```

### Functions 배포 시 `Cloud Build API has not been used`

GCP Console → APIs & Services → Library → **Cloud Build API** 활성화. Firebase Functions Gen 2는 Cloud Build가 필수.

### GitHub Actions에서 `google-github-actions/auth` 실패

- `FIREBASE_SERVICE_ACCOUNT` 시크릿이 JSON 형식 그대로(중괄호 포함) 저장됐는지 확인
- 줄바꿈이 제대로 들어갔는지 (GitHub Secrets 입력창에 그대로 붙여넣기)
- 서비스 계정이 아직 비활성화돼 있지 않은지 GCP Console에서 확인

### `firebase deploy` 중 `The following Firebase Functions could not be updated...`

함수 런타임 업그레이드 이슈. 기존 배포 버전과 Node 버전/런타임이 다르면 재생성 필요:

```bash
firebase functions:delete <functionName> --project $FIREBASE_PROJECT_ID
# 그 후 재배포
```
