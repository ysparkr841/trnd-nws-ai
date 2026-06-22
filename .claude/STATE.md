# STATE.md

## 현재 Phase
Phase 2 — X/Threads 수집기 구현 완료, 세션 설정 후 실제 수집 테스트 필요

## 마지막 실행
- 날짜: 2026-06-23
- 작업: 콘텐츠 품질 셀프 평가 구현 — 규칙 기반 등급 배지 UI
- 결과: 3개 파일 추가/수정, 91개 테스트 통과, dev 브랜치 커밋 (9699c0a)

## 진행 중
없음

## 완료된 작업
- [x] 프로젝트 구조 설계
- [x] 기술 스택 결정
- [x] Next.js 14 (App Router) + TypeScript + Tailwind + ESLint 구성
- [x] Prisma 스키마 (Feed 모델)
- [x] API 라우트 뼈대 4종 (collect, summarize, notion, content)
- [x] lib/collector/{x,threads,rss,github}.ts 뼈대
- [x] lib/ai/ollama.ts, lib/notion/sync.ts, lib/parser/repo-detect.ts
- [x] scripts/save-{x,threads}-session.ts
- [x] .gitignore 재정비
- [x] lint/tsc/jest 통과
- [x] lib/db.ts — Prisma Client 싱글턴
- [x] lib/collector/github.ts — 4개 AI 토픽 순회 수집 + 중복 제거
- [x] lib/parser/repo-detect.ts — /g regex lastIndex 버그 수정
- [x] app/api/collect/route.ts — RSS + GitHub 실제 수집 → DB upsert
- [x] app/api/summarize/route.ts — Ollama 요약 + DB 저장
- [x] app/api/notion/route.ts — Notion 저장 + notionPageId 갱신
- [x] components/feed/FeedCard, RepoCard, FeedList — 피드 UI
- [x] components/layout/CollectButton — 수집 트리거
- [x] app/page.tsx — Server Component 피드 렌더링
- [x] tests/unit/repo-detect.test.ts — 6개 유닛 테스트
- [x] prisma/schema.prisma — provider sqlite로 전환
- [x] .env — DATABASE_URL sqlite(file:./dev.db)로 변경
- [x] .gitignore — dev.db 추가
- [x] prisma db push — dev.db 생성 완료
- [x] lib/collector/x.ts — Playwright 세션 기반 X 수집기 (세션 없음/만료 안전 처리)
- [x] lib/collector/threads.ts — Playwright 세션 기반 Threads 수집기
- [x] app/api/collect/route.ts — X/Threads 수집 통합 (authorHandle 저장, 세션 만료 에러 분리)
- [x] tests/unit/collectors.test.ts — 세션 없음/만료 에러 유닛 테스트 6개
- [x] lib/parser/content.ts — fetchRepoDetails (stars, language, description, topics, README 수집)
- [x] prisma/schema.prisma — repoStars, repoLanguage, repoReadme 필드 추가
- [x] app/api/collect/route.ts — resolveRepoFields 헬퍼로 RSS/X/Threads 레포 상세 수집 통합
- [x] tests/unit/content.test.ts — fetchRepoDetails 유닛 테스트 5개
- [x] lib/util/url.ts — normalizeUrl + urlHash (URL 해시 dedup)
- [x] lib/util/state.ts — appendBlockingQuestion (세션 만료 → STATE.md 블로킹 자동 기록)
- [x] prisma/schema.prisma — urlHash 필드 + @@index 추가
- [x] collect route — 모든 upsert normalizeUrl/urlHash 적용, 세션 만료 STATE.md 연동
- [x] tests/unit/url.test.ts — normalizeUrl/urlHash 유닛 테스트 10개
- [x] lib/notion/sync.ts — flushNotionQueue (저장 실패 큐 재시도), lazy Client 초기화
- [x] app/api/notion/route.ts — PATCH /api/notion 큐 플러시 엔드포인트
- [x] tests/unit/notion-sync.test.ts — saveRepoToNotion/flushNotionQueue 9개 유닛 테스트
- [x] components/feed/InfiniteFeeds.tsx — IntersectionObserver 무한 스크롤 클라이언트 컴포넌트
- [x] app/api/feeds/route.ts — 커서 기반 피드 페이지네이션 API (20건/페이지)
- [x] app/page.tsx — InfiniteFeeds 교체, 콘텐츠 보기 링크 추가
- [x] app/api/content/route.ts — .gitkeep 필터 + 날짜/주제 메타데이터 파싱
- [x] app/api/content/[type]/[filename]/route.ts — 파일 서빙 (path traversal 방어)
- [x] app/content/page.tsx — 콘텐츠 목록 미리보기 UI

## 다음 우선순위 (루프가 처리할 것)
1. P2 콘텐츠 고도화: 관련 유튜브 영상 소스 자동 탐색, 카드뉴스 이미지 자동 생성
2. P2 수집 확장: X/스레드 셀렉터 자동 감지
3. P3: 다크모드, Vercel Cron 자동화

## 콘텐츠 파이프라인 상태
last_content_date: 2026-06-23
past_topics:
  - "Anthropic $965B IPO 준비 — AI 스타트업 역사 최고 밸류에이션"
  - "Anthropic Fable 5·Mythos 5 수출 통제 — 세계 최강 AI 모델의 72시간 사망 사건"
  - "Noam Shazeer OpenAI 합류 — 트랜스포머 공동 저자의 이탈, AI 인재 전쟁 새 국면"

## 수집 실패 로그
없음

## 세션 상태
- X 세션: 미설정 (scripts/save-x-session.ts 실행 필요)
- 스레드 세션: 미설정 (scripts/save-threads-session.ts 실행 필요)

## 메모
- DB: SQLite (prisma/dev.db) — PostgreSQL 불필요
- NOTION_API_KEY, NOTION_DB_ID: .env에 설정 완료
- GITHUB_TOKEN: 없어도 동작 (rate limit만 낮음)
- Playwright 바이너리: 필요 시 npx playwright install chromium
- Ollama: ollama pull llama3.2:3b
- PR #2: https://github.com/ysparkr841/trnd-nws-ai/pull/2
