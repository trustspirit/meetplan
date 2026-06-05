# Calendar Sync for Auto-Matching — Design Spec

**Date:** 2026-06-05
**Scope:** Event result page → 자동 배정 제안 탭 → 구글 캘린더 동기화

---

## Overview

자동 배정 탭에서 조합 하나를 선택한 뒤 "캘린더에 추가" 버튼을 누르면, 배정된 참가자 수만큼 구글 캘린더 이벤트를 일괄 생성한다. 버튼 옆 ⚙ 아이콘으로 언제든 대상 캘린더를 변경할 수 있다.

---

## Architecture

### New Files

| 파일 | 역할 |
|------|------|
| `apps/web/src/features/event-result/useGoogleCalendarWrite.ts` | OAuth(calendar.events 쓰기 권한), 캘린더 목록 조회, 이벤트 일괄 생성 훅 |
| `apps/web/src/features/event-result/CalendarSyncPanel.tsx` | 버튼 + ⚙ 설정 팝오버 컴포넌트 |

### Modified Files

| 파일 | 변경 내용 |
|------|-----------|
| `MatchingView.tsx` | `selectedIdx` 상태를 `GridView`에서 `MatchingView` 레벨로 끌어올림; `ListView`에 라디오 선택 UI 추가; `CalendarSyncPanel` 삽입 |
| `EventResultPage.tsx` | `MatchingView`에 `slots`, `eventTitle`, `eventDescription` props 추가 |

---

## Data Flow

```
EventResultPage
  └─ MatchingView (selectedIdx 상태 보유)
       ├─ ListView  (selectedIdx, onSelectIdx props)
       ├─ GridView  (selectedIdx, onSelectIdx props)
       └─ CalendarSyncPanel
            ├─ useGoogleCalendarWrite 훅
            └─ 설정 팝오버 (캘린더 드롭다운)
```

---

## Hook: `useGoogleCalendarWrite`

```ts
interface GoogleCalendarWriteState {
  connected: boolean;
  connecting: boolean;
  calendarList: CalendarListItem[];
  selectedCalendarId: string | null;
  setSelectedCalendarId: (id: string) => void;
  connect: () => Promise<boolean>;
  createEvents: (events: GCalEventInput[]) => Promise<{ created: number; error: string | null }>;
  creating: boolean;
}

interface GCalEventInput {
  summary: string;
  description?: string;
  start: string; // ISO UTC
  end: string;   // ISO UTC
}
```

- OAuth scope: `https://www.googleapis.com/auth/calendar.events`
- `reauthenticateWithPopup` 사용 (기존 `useGoogleCalendarBusy`와 동일한 패턴)
- 선택된 캘린더 ID는 `localStorage('meetplan-gcal-write-id')`에 저장
- `createEvents`: `POST /calendars/{calendarId}/events` N번 호출 (병렬)
- 401 응답 시 토큰 초기화 → 재연결 유도

---

## Component: `CalendarSyncPanel`

### Props

```ts
interface Props {
  selectedMatching: Matching;             // 선택된 조합
  slots: Slot[];                          // event.slots (start/end 시간 조회용)
  eventTitle: string;
  eventDescription?: string;
  participantNameById: Record<string, string>;
}
```

### UI 상태 머신

```
idle → connecting → connected
                  ↓
               creating → success (3초 후 idle)
                        → error (재시도 가능)
```

### 레이아웃

요약 박스("최대 N/M명 배정 가능") 오른쪽에 배치:

```
[📅 캘린더에 추가]  [⚙]
```

⚙ 팝오버 내용:
- 연결된 구글 계정 (연결 전: "구글 계정 연결" 버튼)
- 캘린더 드롭다운 (연결 후 목록 표시)
- 선택 즉시 localStorage 저장

---

## Calendar Event Format

조합 하나당 `assignments` 수만큼 이벤트 생성:

```
summary:     "{eventTitle} - {participantName}"
description: "{eventDescription}"  (없으면 필드 생략)
start:       { dateTime: slot.start }
end:         { dateTime: slot.end }
```

슬롯 조회: `slots.find(s => s.id === slotId)` — `slot.start`/`slot.end`는 ISO UTC 문자열이므로 구글 캘린더가 사용자 로컬 시간으로 변환하여 표시.

---

## MatchingView Changes

### 상태 끌어올리기

```ts
// MatchingView (기존 GridView 내부에 있던 상태를 이동)
const [selectedIdx, setSelectedIdx] = useState(0);
```

### ListView 변경

각 조합 카드 왼쪽에 라디오 버튼 추가:
```
○  조합 #1
   김민수  6/10 10:00
   이수진  6/10 11:00
```

선택된 카드는 `border-primary` 강조.

### CalendarSyncPanel 삽입 위치

요약 패널(`matching.totalParticipants > 0` 블록) 내 summary 박스 오른쪽에 배치. 조합이 선택되어 있으면 항상 표시.

---

## i18n Keys (추가)

```ts
'gcal.addToCalendar':    '캘린더에 추가'          / 'Add to Calendar'
'gcal.settings':         '캘린더 설정'            / 'Calendar settings'
'gcal.connectAccount':   '구글 계정 연결'          / 'Connect Google account'
'gcal.selectCalendar':   '캘린더 선택'            / 'Select calendar'
'gcal.adding':           '추가 중…'              / 'Adding…'
'gcal.added':            '{n}개 이벤트 추가됨'     / '{n} events added'
'gcal.addFailed':        '추가 실패'              / 'Failed to add'
'gcal.retry':            '다시 시도'              / 'Retry'
'gcal.tokenExpired':     '인증이 만료되었습니다. 다시 연결해주세요.' / 'Session expired. Reconnect.'
```

---

## Out of Scope

- 이벤트 수정/삭제 (단방향 push만)
- 참가자에게 초대장 발송 (organizer 캘린더에만 추가)
- 오프라인 큐잉 / 재시도 자동화
