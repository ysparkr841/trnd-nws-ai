# STATE.md

## 현재 Phase
Phase 1 — MVP 뼈대 구축 완료, 수집 구현 단계

## 마지막 실행
- 날짜: 2026-06-14
- 작업: Next.js 14 프로젝트 초기화 (전체 뼈대)
- 결과: 커밋 595ee2e, dev push, PR #1 생성

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

## 다음 우선순위 (TODO P0)
1. Playwright 브라우저 바이너리 설치 (npx playwright install chromium)
2. X/스레드 세션 저장 (수동 실행 — scripts/save-x-session.ts)
3. RSS 수집 실제 구현 및 테스트
4. GitHub Trending 수집 실제 구현 및 테스트
5. lib/db.ts (Prisma 클라이언트 싱글턴) + DB 저장 로직
6. 메인 피드 UI (FeedList + FeedCard)
7. Ollama 연동 테스트 (llama3.2:3b)

## 콘텐츠 파이프라인 상태
last_content_date: 없음
past_topics: []

## 수집 실패 로그
없음

## 세션 상태
- X 세션: 미설정 (scripts/save-x-session.ts 실행 필요)
- 스레드 세션: 미설정 (scripts/save-threads-session.ts 실행 필요)

## 블로킹 이슈
없음

## 메모
- DATABASE_URL, NOTION_API_KEY, NOTION_DB_ID, GITHUB_TOKEN → .env.local에 설정
- Playwright 바이너리: npx playwright install chromium
- Ollama: llama3.2:3b 설치 확인 필요 (ollama pull llama3.2:3b)
- PR #1: https://github.com/ysparkr841/trnd-nws-ai/pull/1
