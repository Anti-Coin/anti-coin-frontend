# Frontend Tasks Board

- Last Updated (UTC): 2026-03-02
- Status: Active

## 1) Wave Plan (Small Plan)
1. W1: F0 Contract Freeze
2. W2: F1 Core User Plane
3. W3: F2 Trust UX + F3 Free-Tier Guardrails
4. W4: F4 Test & Operability
5. W5: F5 Measured Optimization (trigger-based)

## 2) Atomic Tasks
| ID | Priority | Wave | Task | Done Condition | Rollback |
|---|---|---|---|---|---|
| FE-001 | P0 | W1 | React + Vite 초기화 | 앱 실행 + 기본 라우팅 동작 | 초기 템플릿으로 복귀 |
| FE-002 | P0 | W1 | 계약 기반 API 클라이언트 | manifest/static/status fetch + 에러 명시 | mock 기반 임시 모드 |
| FE-003 | P0 | W1 | 폴링/백오프 설정 반영 | env 기반 polling/backoff 반영 | 하드코딩 기본값 복귀 |
| FE-004 | P0 | W2 | Market 목록/필터/게이트 UI | hidden 비노출 + serve 비활성 + 상태 배지 | 읽기 전용 최소 목록 |
| FE-005 | P1 | W2 | Symbol 상세 화면 | history/prediction 렌더 + 빈 상태 처리 | 텍스트 요약 카드 |
| FE-006 | P1 | W3 | status 보강 폴링 | 선택 항목 status 60초 반영 | status 비활성 + 경고 배너 |
| FE-007 | P1 | W3 | 실패/차단 UX | hard-fail 차단/사유 표시 동작 | 공통 alert fallback |
| FE-008 | P1 | W3 | free-tier 절약 로직 | 변경 감지 기반 부분 재조회 + 탭 비활성 감속 | 고정 주기 조회 |
| FE-009 | P1 | W4 | 테스트 기준선 | 계약 파서/게이트/UI 상태 테스트 추가 | 수동 검증 절차만 유지 |
| FE-010 | P1 | W4 | 실행/운영 문서 | 실행, 환경변수, 스모크 절차 문서화 | 최소 실행 메모 |
| FE-011 | P2 | W5 | 최적화(조건부) | 병목 지표 개선 근거 확보 | 최적화 커밋 롤백 |

## 3) Current Focus
1. Active Wave: W1
2. Active Tasks: `FE-001`, `FE-002`, `FE-003`

## 4) Verification Baseline per Task
1. 기능 경로 1개 이상 + 실패 경로 1개 이상
2. 정책 검증:
   - `visibility`
   - `serve_allowed`
   - `prediction.status`
3. 회귀 위험이 큰 경우 수동 스모크 절차 문서화

## 5) Update Rules
1. 우선순위 변경 시 Wave와 Task를 동시 수정
2. Done 시 검증 증거(테스트/수동 절차) 기록
3. 보류 시 재개 조건과 리스크를 명시
