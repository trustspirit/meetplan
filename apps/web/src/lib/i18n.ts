export type Locale = 'ko' | 'en';

const ko = {
  // ── Organizer term ──────────────────────────────────────────────────
  'organizer': '주최자',

  // ── App / Common ─────────────────────────────────────────────────────
  'app.name': 'MeetPlan',
  'common.loading': '불러오는 중…',
  'common.saving': '저장 중…',
  'common.saveFailed': '저장 실패',
  'common.inputError': '입력 오류',
  'common.close': '닫기',
  'common.more': '더보기',
  'common.cancel': '취소',
  'common.backToDashboard': '← 대시보드로',
  'common.backToDashboardShort': '← 대시보드',

  // ── Language toggle ──────────────────────────────────────────────────
  'lang.ko': '한국어',
  'lang.en': 'English',

  // ── Login ────────────────────────────────────────────────────────────
  'login.loading': '로딩…',
  'login.subtitle': '가능한 시간을 공유하고, 서로 안 겹치는 1:1 일정을 찾아보세요.',
  'login.googleSignIn': 'Google로 계속하기',

  // ── Dashboard ────────────────────────────────────────────────────────
  'dashboard.signOut': '로그아웃',
  'dashboard.loading': '로딩 중…',
  'dashboard.myEvents': '내 이벤트',
  'dashboard.newEvent': '+ 새 이벤트',
  'dashboard.emptyTitle': '아직 이벤트가 없습니다',
  'dashboard.emptyDesc': '가능한 시간을 공유하고 참가자들의 응답을 모아보세요.',
  'dashboard.createFirst': '+ 첫 이벤트 만들기',

  // ── Event list ───────────────────────────────────────────────────────
  'list.statusOpen': '진행 중',
  'list.statusClosed': '마감됨',
  'list.slotInfo': '{slots}개 슬롯 · {minutes}분',

  // ── Event Create / BasicInfoForm ─────────────────────────────────────
  'create.back': '← 돌아가기',
  'create.pageTitle': '새 이벤트 만들기',
  'create.submit': '생성',
  'create.submitMobile': '생성하기',
  'create.slotsPreview': '자동 생성될 슬롯: {count}개',
  'create.followUpSuffix': '(후속)',
  'create.calendarSynced': '구글 캘린더 연동됨 — 줄무늬 셀에 기존 일정이 있습니다',
  'form.eventTitle': '이벤트 이름',
  'form.eventTitlePlaceholder': '예: 2분기 1:1 미팅',
  'form.notes': '노트',
  'form.notesPlaceholder': '공유 링크를 받는 대상에게 전달할 내용 (선택)',
  'form.meetingLength': '미팅 길이',
  'period.suffix': '분',
  'period.custom': '직접 입력',
  'period.customClose': '직접 입력 닫기',
  'period.placeholder': '분',

  // ── Calendar Banner ──────────────────────────────────────────────────
  'calendar.title': '구글 캘린더 연동',
  'calendar.hint': '기존 일정이 있는 시간대를 페인팅 그리드에서 확인하세요',
  'calendar.hintDisabled': '날짜를 먼저 선택하면 기존 일정을 확인할 수 있습니다',
  'calendar.hintPicker': '참고할 캘린더를 선택하세요',
  'calendar.errorSuffix': '— 다시 시도하거나 건너뛰세요',
  'calendar.skip': '건너뛰기',
  'calendar.connect': '연동하기',
  'calendar.connecting': '연결 중…',
  'calendar.apply': '적용',
  'calendar.loading': '불러오는 중…',
  'calendar.primary': '(기본)',
  'calendar.selectedDates': '선택: {count}일',

  // ── Mobile Wizard ────────────────────────────────────────────────────
  'wizard.step1': '1/2단계 · 기본 정보 + 날짜',
  'wizard.step2': '2/2단계 · 시간 페인팅',
  'wizard.next': '다음',
  'wizard.prev': '이전',
  'wizard.slotCount': '{count}개 슬롯',
  'wizard.calendarSynced': '구글 캘린더 연동됨',
  'wizard.busyCellHint': '줄무늬 = 캘린더 일정 있음',
  'wizard.dragHint': '꾹 눌러 드래그해서 연속된 시간을 한번에 칠하세요',

  // ── TimePainter ──────────────────────────────────────────────────────
  'painter.title': '가용 시간 페인팅',
  'painter.hint': '셀을 클릭하거나 드래그해서 가능한 시간을 한번에 칠하세요.',
  'painter.hintLabel': '팁:',
  'painter.hintClose': '닫기',
  'painter.busyCellHint': '줄무늬 = 구글 캘린더에 기존 일정 있음 (페인팅 가능)',
  'painter.selectDatesFirst': '왼쪽 캘린더에서 날짜를 먼저 선택하세요',

  // ── Respond page ─────────────────────────────────────────────────────
  'respond.loading': '불러오는 중…',
  'respond.googleSignIn': 'Google 로그인',
  'respond.subtitle': '{periodMinutes}분 미팅 · 가능한 시간을 선택해주세요',
  'respond.subtitleMobile': '{periodMinutes}분 미팅 · 가능 시간 선택',
  'respond.selectedCount': '선택: {count}개',
  'respond.chooseTime': '시간을 선택해주세요',
  'respond.firstSelectedTime': '선택한 시간',
  'respond.moreSlots': '외 {count}개 시간대',
  'respond.submit': '제출',
  'respond.saving': '저장 중…',
  'respond.submitError': '저장 실패',
  'respond.eventNotFound': '이벤트를 찾을 수 없어요',
  'respond.eventNotFoundHint': '링크가 잘못되었거나 삭제된 이벤트입니다.',
  'respond.eventClosed': '마감된 이벤트입니다',
  'respond.eventClosedHint': '이 이벤트는 더 이상 응답을 받지 않습니다.',
  'respond.backToDashboard': '← 대시보드로',

  // ── Respond — error/retry ────────────────────────────────────────────
  'respond.retry': '다시 시도',

  // ── Submit success — next steps ──────────────────────────────────────
  'success.nextStepsTitle': '다음에는',
  'success.nextStep1': '주최자가 응답을 확인하고 미팅 일정을 확정합니다',
  'success.nextStep2': '확정되면 등록하신 번호로 문자 알림이 갑니다',

  // ── Matching ─────────────────────────────────────────────────────────
  'matching.description': '각 참가자가 서로 겹치지 않는 시간에 1:1 미팅을 할 수 있는 최적 배정 조합입니다.',

  // ── ParticipantGrid ──────────────────────────────────────────────────
  'grid.dimmedCellHint': '흐린 셀은 선택 불가한 시간입니다',
  'grid.usageHint': '클릭·드래그로 선택 · 다시 클릭하면 취소',
  'grid.paintHintLabel': '처음이신가요?',
  'grid.paintHintClose': '닫기',
  'grid.paintHint': '셀을 클릭하거나 드래그해서 선택하세요. 선택된 셀을 다시 클릭하면 취소됩니다.',
  'grid.available': '가능',

  // ── ParticipantForm ──────────────────────────────────────────────────
  'form.nameLabel': '이름',
  'form.namePlaceholder': '예: 김민수',
  'form.nameHint': '이름은 공개되지 않습니다',
  'form.phoneLabel': '전화번호',
  'form.phonePlaceholder': '010-1234-5678',
  'form.phoneHint': '일정이 확정되면 문자 연락에 사용됩니다',
  'form.phoneError': '010-1234-5678 형식으로 입력해주세요',
  'form.respondentNote': '기타 사항',
  'form.respondentNotePlaceholder': '전달할 내용이 있으면 적어주세요 (선택)',

  // ── Submit success ───────────────────────────────────────────────────
  'success.title': '응답 완료',
  'success.thanks': '{name} 님, 감사합니다!',
  'success.meetingInfo': '{periodMinutes}분 미팅 · {slotCount}개 시간대 선택',
  'success.organizerWillNotify': '일정이 확정되면 문자로 알려드립니다',
  'success.editLink': '수정 링크',
  'success.editLinkNote': '(변경 시에만 필요)',
  'success.editLinkSave': '저장 안 해도 괜찮아요 — 수정할 때만 필요합니다',
  'success.copy': '복사',
  'success.copied': '복사됨',
  'success.authedHint': '같은 계정으로 재접속하면 수정할 수 있습니다.',

  // ── Event edit ───────────────────────────────────────────────────────
  'edit.title': '이벤트 편집',
  'edit.back': '← 결과로 돌아가기',
  'edit.save': '저장',
  'edit.notFound': '이벤트를 찾을 수 없습니다',
  'edit.metaDesc': '{periodMinutes}분 미팅 · 제목/길이는 편집할 수 없어요 (삭제 후 재생성 필요)',
  'edit.slotsToUpdate': '업데이트될 슬롯: {count}개',
  'edit.hasResponses': '응답 {count}명 있음',
  'edit.warningDesc': '저장 시 삭제된 시간을 선택했던 응답만 해당 선택이 자동 제거되고, 나머지 선택은 그대로 유지됩니다. 새로 추가된 시간은 참가자가 다시 접속해야 선택 가능합니다.',
  'edit.warningLink': '공유 링크(/e/...)는 그대로 유지됩니다.',

  // ── Event result ─────────────────────────────────────────────────────
  'result.loading': '로딩 중',
  'result.subtitle': '{periodMinutes}분 · 응답 {count}명',
  'result.headerInfo': '{periodMinutes}분 미팅 · 응답 {responses}명 · 슬롯 {slots}개',
  'result.copyEvent': '새 이벤트로 복사',
  'result.edit': '편집',
  'result.reopen': '다시 열기',
  'result.close': '마감',
  'result.delete': '삭제',
  'result.tabMatrix': '가용성 매트릭스',
  'result.tabMatching': '자동 배정 제안',
  'result.loadingResponses': '응답 불러오는 중…',
  'result.statusChangeFailed': '상태 변경 실패',
  'result.statusOpen': '진행 중',
  'result.statusClosed': '마감됨',
  'result.copyTitle': '이 이벤트의 시간대를 그대로 가져와 새 이벤트 생성',
  'result.notFound': '이벤트를 찾을 수 없어요',
  'result.notFoundHint': '링크가 잘못되었거나 삭제된 이벤트입니다.',
  'result.participantNotes': '참가자 노트',

  // ── ResponseMatrix ───────────────────────────────────────────────────
  'matrix.noResponses': '아직 응답이 없습니다',
  'matrix.viewHeatmap': '가용 현황',
  'matrix.viewParticipant': '참가자별',
  'matrix.colTime': '시간',
  'matrix.colDatetime': '날짜 / 시간',
  'matrix.rowAvailSlots': '가능 슬롯',
  'matrix.available': '가능',
  'matrix.availabilityLegend': '가용률:',

  // ── MatchingView ─────────────────────────────────────────────────────
  'matching.noResponses': '응답이 모이면 자동 배정 조합이 표시됩니다',
  'matching.hiddenEmpty': '{count}명이 숨겨져 있어 배정 대상이 없습니다. 위 범례에서 참가자를 표시하세요.',
  'matching.summary': '최대 {max} / {total}명 배정 가능',
  'matching.combinations': '가능한 조합 {count}개 표시',
  'matching.combinationsTruncated': '(상위 20개)',
  'matching.hiddenNote': '{count}명 숨김 제외',
  'matching.viewList': '목록',
  'matching.viewGrid': '그리드',
  'matching.comboLabel': '조합 #{num}',
  'matching.unmatched': '미배정:',
  'matching.colTime': '시간',

  // ── Delete ───────────────────────────────────────────────────────────
  'delete.button': '이벤트 삭제',
  'delete.title': '이벤트를 삭제하시겠어요?',
  'delete.confirm': '"{title}"와 모든 응답({count}명)이 영구 삭제됩니다. 되돌릴 수 없어요.',
  'delete.deleting': '삭제 중…',
  'delete.permanentDelete': '영구 삭제',
  'delete.failed': '삭제 실패',

  // ── Share ────────────────────────────────────────────────────────────
  'share.button': '공유 링크 복사',
  'share.compact': '공유',
  'share.copied': '복사됨',
  'share.ariaLabel': '공유 링크 복사',

  // ── Event type ───────────────────────────────────────────────────────
  'eventType.label': '이벤트 유형',
  'eventType.meeting': '일반 미팅',
  'eventType.wardVisit': '와드 방문',

  // ── Ward visit — create ──────────────────────────────────────────────
  'ward.stakeLabel': '스테이크 / 지방부',
  'ward.stakePlaceholder': '스테이크를 선택하세요',
  'ward.datesLabel': '방문 가능 일요일',
  'ward.datesHint': '응답자가 와드/지부별 방문 날짜를 이 중에서 배정합니다',
  'ward.submitMobile': '이벤트 만들기',
  'ward.selectSundayHint': '일요일만 선택할 수 있습니다',

  // ── Ward visit — respond ─────────────────────────────────────────────
  'ward.respondTitle': '와드 방문 날짜 배정',
  'ward.respondSubtitle': '{stake} · 아래 와드/지부별로 방문 날짜를 선택해주세요',
  'ward.assignedCount': '{count}개 배정됨',
  'ward.totalCount': '전체 {count}개',
  'ward.submitAssignment': '배정 제출',
  'ward.assignHint': '와드/지부별로 방문 날짜를 선택하세요',
  'ward.conflictTitle': '제출 전 확인하세요',
  'ward.confirmAnyway': '그래도 이대로 제출하시겠습니까?',
  'ward.confirmAndSubmit': '확인 후 제출',
  'ward.backToEdit': '다시 수정',
  'ward.noWards': '소속 와드/지부 정보가 없습니다',
  'ward.noDates': '방문 가능 날짜가 없습니다',
  'ward.saving': '저장 중…',
  'ward.saveFailed': '저장 실패',
  'ward.successTitle': '{name}님, 배정이 완료되었습니다!',
  'ward.successDesc': '{stake}의 와드/지부 방문 날짜 배정이 저장되었습니다.',
  'ward.saveEditLink': '수정이 필요하면 이 링크를 저장하세요',
  'ward.dateConflict': '날짜 중복',
  'ward.unassignedWarning': '{count}개 와드/지부 미배정',
  'ward.dateOccupied': '{name}이(가) 이미 이 날짜를 사용 중',
  'ward.selectedSundays': '선택된 일요일: {count}일',

  // ── Ward visit — result ──────────────────────────────────────────────
  'ward.resultTitle': '와드 방문 배정 현황',
  'ward.resultNoResponse': '아직 배정이 없습니다',
  'ward.resultNoResponseHint': '공유 링크를 전달하면 배정자가 날짜를 배정할 수 있습니다',
  'ward.resultColWard': '와드 / 지부',
  'ward.resultColDate': '방문 날짜',
  'ward.resultUnassigned': '미배정',
  'ward.respondedBy': '{name}님이 배정',

  // ── Google Calendar sync ──────────────────────────────────────────────
  'gcal.addToCalendar':  '캘린더에 추가',
  'gcal.settings':       '캘린더 설정',
  'gcal.connectAccount': '구글 계정 연결',
  'gcal.selectCalendar': '캘린더 선택',
  'gcal.adding':         '추가 중…',
  'gcal.added':          '{n}개 이벤트 추가됨',
  'gcal.addFailed':      '추가 실패',
  'gcal.tokenExpired':   '인증이 만료되었습니다. 다시 연결해주세요.',
} as const;

type Dict = typeof ko;
type TranslationMap = Record<keyof Dict, string>;

const en: TranslationMap = {
  'organizer': 'Organizer',

  'app.name': 'MeetPlan',
  'common.loading': 'Loading…',
  'common.saving': 'Saving…',
  'common.saveFailed': 'Save failed',
  'common.inputError': 'Input error',
  'common.close': 'Close',
  'common.more': 'More',
  'common.cancel': 'Cancel',
  'common.backToDashboard': '← Back to dashboard',
  'common.backToDashboardShort': '← Dashboard',

  'lang.ko': '한국어',
  'lang.en': 'English',

  'login.loading': 'Loading…',
  'login.subtitle': 'Share your availability and find 1:1 meeting times that work for everyone.',
  'login.googleSignIn': 'Continue with Google',

  'dashboard.signOut': 'Sign out',
  'dashboard.loading': 'Loading…',
  'dashboard.myEvents': 'My Events',
  'dashboard.newEvent': '+ New Event',
  'dashboard.emptyTitle': 'No events yet',
  'dashboard.emptyDesc': 'Share your availability and collect responses from participants.',
  'dashboard.createFirst': '+ Create first event',

  'list.statusOpen': 'Open',
  'list.statusClosed': 'Closed',
  'list.slotInfo': '{slots} slots · {minutes} min',

  'create.back': '← Back',
  'create.pageTitle': 'New Event',
  'create.submit': 'Create',
  'create.submitMobile': 'Create',
  'create.slotsPreview': 'Slots to generate: {count}',
  'create.followUpSuffix': '(follow-up)',
  'create.calendarSynced': 'Google Calendar synced — striped cells have existing events',
  'form.eventTitle': 'Event name',
  'form.eventTitlePlaceholder': 'e.g. Q2 1:1 meeting',
  'form.notes': 'Notes',
  'form.notesPlaceholder': 'A message for recipients of the share link (optional)',
  'form.meetingLength': 'Meeting length',
  'period.suffix': ' min',
  'period.custom': 'Custom',
  'period.customClose': 'Close',
  'period.placeholder': 'min',

  'calendar.title': 'Google Calendar',
  'calendar.hint': 'See existing events in the painting grid',
  'calendar.hintDisabled': 'Select dates first to check for existing events',
  'calendar.hintPicker': 'Select a calendar to reference',
  'calendar.errorSuffix': '— try again or skip',
  'calendar.skip': 'Skip',
  'calendar.connect': 'Connect',
  'calendar.connecting': 'Connecting…',
  'calendar.apply': 'Apply',
  'calendar.loading': 'Loading…',
  'calendar.primary': '(primary)',
  'calendar.selectedDates': 'Selected: {count} days',

  'wizard.step1': 'Step 1/2 · Info + dates',
  'wizard.step2': 'Step 2/2 · Paint times',
  'wizard.next': 'Next',
  'wizard.prev': 'Back',
  'wizard.slotCount': '{count} slots',
  'wizard.calendarSynced': 'Google Calendar synced',
  'wizard.busyCellHint': 'Striped = existing calendar event',
  'wizard.dragHint': 'Press and drag to paint multiple times at once',

  'painter.title': 'Paint availability',
  'painter.hint': 'Click or drag cells to paint your available times at once.',
  'painter.hintLabel': 'Tip:',
  'painter.hintClose': 'Close',
  'painter.busyCellHint': 'Striped = existing Google Calendar event (can still paint)',
  'painter.selectDatesFirst': 'Select dates from the calendar on the left',

  'respond.loading': 'Loading…',
  'respond.googleSignIn': 'Sign in with Google',
  'respond.subtitle': '{periodMinutes}-min meeting · Select your available times',
  'respond.subtitleMobile': '{periodMinutes}-min meeting · Select availability',
  'respond.selectedCount': 'Selected: {count}',
  'respond.chooseTime': 'Please select a time',
  'respond.firstSelectedTime': 'Selected time',
  'respond.moreSlots': '{count} more slots',
  'respond.submit': 'Submit',
  'respond.saving': 'Saving…',
  'respond.submitError': 'Save failed',
  'respond.eventNotFound': 'Event not found',
  'respond.eventNotFoundHint': 'The link may be invalid or the event has been deleted.',
  'respond.eventClosed': 'This event is closed',
  'respond.eventClosedHint': 'This event is no longer accepting responses.',
  'respond.backToDashboard': '← Back to dashboard',

  'respond.retry': 'Try again',

  'success.nextStepsTitle': "What's next",
  'success.nextStep1': 'The organizer reviews responses and confirms a meeting time',
  'success.nextStep2': "You'll receive a text notification when the time is confirmed",

  'matching.description': 'Optimal 1:1 schedule where each participant gets a unique, non-overlapping time slot.',

  'grid.dimmedCellHint': 'Dimmed cells are not selectable',
  'grid.usageHint': 'Click or drag to select · click again to deselect',
  'grid.paintHintLabel': 'First time?',
  'grid.paintHintClose': 'Close',
  'grid.paintHint': 'Click or drag to select times. Click a selected cell again to deselect.',
  'grid.available': 'Available',

  'form.nameLabel': 'Name',
  'form.namePlaceholder': 'e.g. John Kim',
  'form.nameHint': 'Your name is not public',
  'form.phoneLabel': 'Phone number',
  'form.phonePlaceholder': '010-1234-5678',
  'form.phoneHint': 'Used to contact you when the time is confirmed',
  'form.phoneError': 'Please enter in 010-1234-5678 format',
  'form.respondentNote': 'Notes',
  'form.respondentNotePlaceholder': 'Any message for the organizer (optional)',

  'success.title': 'Response Submitted',
  'success.thanks': 'Thank you, {name}!',
  'success.meetingInfo': '{periodMinutes}-min meeting · {slotCount} time slots selected',
  'success.organizerWillNotify': "You'll be notified by text when the time is confirmed.",
  'success.editLink': 'Edit link',
  'success.editLinkNote': '(only needed to edit)',
  'success.editLinkSave': 'No need to save — only needed if you want to edit your response.',
  'success.copy': 'Copy',
  'success.copied': 'Copied',
  'success.authedHint': 'Sign in with the same account to edit your response.',

  'edit.title': 'Edit Event',
  'edit.back': '← Back to results',
  'edit.save': 'Save',
  'edit.notFound': 'Event not found',
  'edit.metaDesc': '{periodMinutes}-min meeting · Title and length cannot be edited (delete and recreate)',
  'edit.slotsToUpdate': 'Slots to update: {count}',
  'edit.hasResponses': '{count} responses received',
  'edit.warningDesc': 'Saving will remove slot selections only for deleted times. Other selections are preserved. Newly added times require participants to re-visit.',
  'edit.warningLink': 'The share link (/e/...) remains the same.',

  'result.loading': 'Loading',
  'result.subtitle': '{periodMinutes} min · {count} responses',
  'result.headerInfo': '{periodMinutes}-min meeting · {responses} responses · {slots} slots',
  'result.copyEvent': 'Copy as new event',
  'result.edit': 'Edit',
  'result.reopen': 'Reopen',
  'result.close': 'Close',
  'result.delete': 'Delete',
  'result.tabMatrix': 'Availability matrix',
  'result.tabMatching': 'Auto-matching',
  'result.loadingResponses': 'Loading responses…',
  'result.statusChangeFailed': 'Status change failed',
  'result.statusOpen': 'Open',
  'result.statusClosed': 'Closed',
  'result.copyTitle': 'Create a new event with the same time slots',
  'result.notFound': 'Event not found',
  'result.notFoundHint': 'The link may be invalid or the event has been deleted.',
  'result.participantNotes': 'Participant notes',

  'matrix.noResponses': 'No responses yet',
  'matrix.viewHeatmap': 'Availability',
  'matrix.viewParticipant': 'By participant',
  'matrix.colTime': 'Time',
  'matrix.colDatetime': 'Date / Time',
  'matrix.rowAvailSlots': 'Available',
  'matrix.available': 'Available',
  'matrix.availabilityLegend': 'Availability:',

  'matching.noResponses': 'Combinations will appear once responses come in',
  'matching.hiddenEmpty': '{count} participants hidden — no one left to match. Show them in the legend above.',
  'matching.summary': 'Up to {max} of {total} participants can be matched',
  'matching.combinations': '{count} combinations shown',
  'matching.combinationsTruncated': '(top 20)',
  'matching.hiddenNote': '{count} hidden excluded',
  'matching.viewList': 'List',
  'matching.viewGrid': 'Grid',
  'matching.comboLabel': 'Combo #{num}',
  'matching.unmatched': 'Unmatched:',
  'matching.colTime': 'Time',

  'delete.button': 'Delete event',
  'delete.title': 'Delete this event?',
  'delete.confirm': '"{title}" and all {count} responses will be permanently deleted. This cannot be undone.',
  'delete.deleting': 'Deleting…',
  'delete.permanentDelete': 'Delete permanently',
  'delete.failed': 'Delete failed',

  'share.button': 'Copy share link',
  'share.compact': 'Share',
  'share.copied': 'Copied',
  'share.ariaLabel': 'Copy share link',

  'eventType.label': 'Event type',
  'eventType.meeting': 'Regular meeting',
  'eventType.wardVisit': 'Ward visit',

  'ward.stakeLabel': 'Stake / District',
  'ward.stakePlaceholder': 'Select a stake',
  'ward.datesLabel': 'Available Sundays',
  'ward.datesHint': 'The respondent will assign a visit date from these options for each ward/branch',
  'ward.submitMobile': 'Create event',
  'ward.selectSundayHint': 'Only Sundays can be selected',

  'ward.respondTitle': 'Ward Visit Date Assignment',
  'ward.respondSubtitle': '{stake} · Please assign a visit date for each ward/branch below',
  'ward.assignedCount': '{count} assigned',
  'ward.totalCount': '{count} total',
  'ward.submitAssignment': 'Submit assignment',
  'ward.assignHint': 'Select a visit date for each ward/branch',
  'ward.conflictTitle': 'Please review before submitting',
  'ward.confirmAnyway': 'Submit with these assignments anyway?',
  'ward.confirmAndSubmit': 'Confirm and submit',
  'ward.backToEdit': 'Go back and edit',
  'ward.noWards': 'No wards/branches found for this stake',
  'ward.noDates': 'No available dates',
  'ward.saving': 'Saving…',
  'ward.saveFailed': 'Save failed',
  'ward.successTitle': '{name}, assignment complete!',
  'ward.successDesc': 'Ward/branch visit dates for {stake} have been saved.',
  'ward.saveEditLink': 'Save this link if you need to edit later',
  'ward.dateConflict': 'Date conflict',
  'ward.unassignedWarning': '{count} ward(s)/branch(es) unassigned',
  'ward.dateOccupied': '{name} is already using this date',
  'ward.selectedSundays': 'Selected Sundays: {count}',

  'ward.resultTitle': 'Ward Visit Assignments',
  'ward.resultNoResponse': 'No assignments yet',
  'ward.resultNoResponseHint': 'Share the link so the assignee can fill in visit dates',
  'ward.resultColWard': 'Ward / Branch',
  'ward.resultColDate': 'Visit date',
  'ward.resultUnassigned': 'Unassigned',
  'ward.respondedBy': 'Assigned by {name}',

  // ── Google Calendar sync ──────────────────────────────────────────────
  'gcal.addToCalendar':  'Add to Calendar',
  'gcal.settings':       'Calendar settings',
  'gcal.connectAccount': 'Connect Google account',
  'gcal.selectCalendar': 'Select calendar',
  'gcal.adding':         'Adding…',
  'gcal.added':          '{n} events added',
  'gcal.addFailed':      'Failed to add',
  'gcal.tokenExpired':   'Session expired. Reconnect.',
};

const dicts: Record<Locale, TranslationMap> = { ko, en };

function readStoredLocale(): Locale | null {
  try { return localStorage.getItem('meetplan-locale') as Locale | null; } catch { return null; }
}

const stored = readStoredLocale();
const detected: Locale = stored ?? 'ko';

let _locale: Locale = detected;

// Sync the HTML lang attribute with the active locale so screen readers and crawlers see the correct language.
if (typeof document !== 'undefined') {
  document.documentElement.lang = _locale;
}

export function setLocale(locale: Locale): void {
  try { localStorage.setItem('meetplan-locale', locale); } catch { /* ignore */ }
  window.location.reload();
}

export function getLocale(): Locale {
  return _locale;
}

export function t(key: keyof Dict, vars?: Record<string, string | number>): string {
  const dict = dicts[_locale] ?? dicts.ko;
  let str: string = dict[key] ?? (dicts.ko[key] as string);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}
