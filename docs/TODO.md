# TODO.md — AI 뉴스 허브 백로그

## P0 — Critical (MVP 필수)

### 셋업
- [x] Next.js 14 프로젝트 초기화 (TypeScript + Tailwind + ESLint)
- [x] Prisma + SQLite 스키마 및 Prisma 싱글턴 (lib/db.ts) — postgresql→sqlite 전환 완료
- [x] DATABASE_URL 설정 (file:./dev.db), NOTION_API_KEY/DB_ID 설정 완료
- [x] prisma db push — dev.db 생성 완료
- [x] npx prisma generate — 클라이언트 재생성 완료
- [x] Playwright 설치 및 브라우저 바이너리 설치 — chromium 1223 확인 완료
- [x] Ollama 연동 테스트 (llama3.2:3b) — summarizeRepoWithOllama 구현 완료

### 보조 수집
- [x] RSS 수집 구현 (lib/collector/rss.ts)
- [x] GitHub Trending 수집 (lib/collector/github.ts) — 4개 AI 토픽

### 메인 수집 — X/스레드 ⭐
- [x] X 세션 저장 스크립트 (scripts/save-x-session.ts) — 수동 실행 필요
- [x] 스레드 세션 저장 스크립트 (scripts/save-threads-session.ts) — 수동 실행 필요
- [x] X 피드 수집 구현 (lib/collector/x.ts) — Playwright 세션 기반
- [x] 스레드 피드 수집 구현 (lib/collector/threads.ts) — Playwright 세션 기반
- [x] 세션 만료 감지 + 중단 조건 연동 (STATE.md 블로킹 질문 자동 기록)
- [x] 중복 dedup 로직 (URL 해시 기준)

### 깃헙 레포 감지 + 노션 저장 ⭐
- [x] 깃헙 URL 감지 (lib/parser/repo-detect.ts)
- [x] GitHub API로 레포 정보 + README 수집
- [x] Ollama로 레포 요약 생성 — repoSummary 필드 + summarizeRepoWithOllama 연동
- [x] 노션 자동 저장 (lib/notion/sync.ts) — 구현 완료
- [x] 저장 실패 시 로컬 큐잉 — flushNotionQueue + PATCH /api/notion

### 피드 UI
- [x] 메인 피드 페이지 (FeedList + FeedCard)
- [x] 깃헙 레포 카드 (RepoCard)
- [x] 무한 스크롤

### API
- [x] 수집 API (app/api/collect/route.ts)
- [x] 요약 API (app/api/summarize/route.ts)
- [x] Notion 저장 API (app/api/notion/route.ts)

## P1 — High

### 콘텐츠 파이프라인 ⭐
- [x] content/ 디렉토리 구조 확정 — articles/scripts/cards 3종
- [x] Article 템플릿 실제 생성 후 품질 확인 — 2026-06-22 Fable5 주제로 검증
- [x] 유튜브 대본 템플릿 검증 — 15분 분량 대본 생성 완료
- [x] 카드뉴스 JSON 스키마 검증 — 7장 cards 배열 스키마 확정
- [x] 생성 콘텐츠 조회 API (app/api/content/route.ts)
- [x] 생성 콘텐츠 웹 미리보기 UI

### 수집 고도화
- [x] 소스별 수집 주기 설정 — intervalMinutes per RSS + githubIntervalMinutes, isWithinInterval 체크
- [x] 수집 실패 알림 — collect-state.json per-source 에러 추적 + /settings 실패 배너
- [x] 소스 추가/제거 UI — /settings 페이지, /api/sources CRUD, config/sources.json 동적 로딩

### UI 개선
- [x] 소스 필터
- [x] 읽음/안읽음
- [x] 북마크
- [x] 검색

## P2 — Medium

### 콘텐츠 고도화
- [ ] 관련 유튜브 영상 소스 자동 탐색
- [ ] 카드뉴스 이미지 자동 생성
- [x] 주간 아카이브 페이지
- [x] 콘텐츠 품질 셀프 평가

### 수집 확장
- [ ] X/스레드 셀렉터 자동 감지
- [x] 키워드 필터

## P3 — Low
- [ ] 다크모드 / PWA
- [ ] Vercel Cron 자동화
- [ ] GitHub Actions CI/CD
- [ ] 다중 유저 지원 (수익화 기반)
