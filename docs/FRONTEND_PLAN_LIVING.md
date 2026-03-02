# Frontend Living Plan

- Last Updated (UTC): 2026-03-02
- Status: Active
- Scope: anti-coin-frontend 큰 계획(phase), 실행 타이밍, 최적화 착수 기준

## 1) Intent
1. 백엔드-블라인드 원칙으로 안정적인 사용자 플레인을 구현한다.
2. YAGNI 기반으로 "작동하는 최소 제품"을 먼저 잠근다.
3. 최적화는 측정 기반으로 단계 착수하고, 과조기 최적화를 금지한다.

## 2) Fixed Constraints
1. FE/BE 분리 서버 운영
2. 계약 경로만 사용:
   - `manifest`, `history`, `prediction`, `status`
3. 정책 고정:
   - `hidden_backfilling` 비노출
   - `serve_allowed=false` 비활성
   - `hard_stale/corrupt/missing` 차단
4. 시간 처리:
   - 내부 UTC, 표시 경계에서만 변환

## 3) Big Plan (Expanded)
| Phase | Theme | Objective | Exit Condition |
|---|---|---|---|
| F0 | Contract Freeze | 계약/환경변수/폴링 정책 고정 | 계약 파서/실패 처리 기준 문서화 |
| F1 | Core User Plane | 시장 목록 + 심볼 상세의 읽기 경로 확보 | 주요 경로 수동 검증 완료 |
| F2 | Trust UX | 상태/차단/복구를 사용자에게 정직하게 전달 | hard-fail 차단 + stale/degraded 경고 일관성 |
| F3 | Free-Tier Guardrails | 요청량/렌더 비용 상한을 운영 가능한 수준으로 고정 | polling/refresh/캐시 정책 계측 근거 확보 |
| F4 | Test & Operability | 회귀와 장애 진단 가능성 확보 | 계약/게이트 테스트 + 스모크 절차 문서 완료 |
| F5 | Measured Optimization | 병목이 확인된 구간만 최적화 | 성능 지표 개선 증거와 회귀 무손상 확인 |

## 4) UX Strategy (Big-Plan Level)
1. 기본 UX 원칙:
   - 실패를 숨기지 않음
   - 잘못된 데이터 노출 금지
   - 정보 밀도보다 상태 정직성 우선
2. 화면 축:
   - 시장 개요: 심볼/타임프레임 상태와 접근 가능성
   - 상세 보기: 히스토리/예측 + 신뢰 신호(상태/업데이트 시각)
   - 운영 신호: status 기반 보조 배지/배너
3. 상태 전달 규칙:
   - `stale`: 경고 + 읽기 가능
   - `degraded`: 품질 경고 배지
   - `serve_allowed=false`: 항목 표시는 유지, 진입은 차단

## 5) Free-Tier Strategy (Big-Plan Level)
1. 네트워크 절약:
   - manifest 주기 조회, 상세 데이터는 변경 감지 시 재조회
2. 렌더 절약:
   - 비가시 영역 렌더 지연
   - 탭 비활성 시 폴링 감속
3. 실패 제어:
   - 재시도 백오프 고정
   - 반복 실패 시 사용자 명시 오류 + 무한 재시도 방지
4. 운영 단순성:
   - 외부 의존성 최소화
   - build/runtime 설정 단순화

## 6) Optimization Timing Policy
1. 최적화 시작 전제:
   - F1/F2/F4 완료(기능/정책/검증 기준선 확보)
2. 착수 트리거:
   - 실제 병목 지표 또는 사용자 체감 이슈가 관측될 때만
3. 금지:
   - 근거 없는 프레임워크/캐시/상태관리 과도 도입
4. 완료 기준:
   - 지표 개선 + 정책 정합성 유지 + 롤백 경로 확보

## 7) Phase Timing (Best-Effort)
1. F0: 0.5~1일
2. F1: 2~4일
3. F2: 1~2일
4. F3: 1~2일
5. F4: 1~2일
6. F5: 트리거 발생 시 착수(고정 일정 없음)

## 8) Links
1. 실행 보드: `FRONTEND_TASKS.md`
2. 결정 기록: `FRONTEND_DECISIONS.md`
3. 쟁점 로그: `FRONTEND_DISCUSSION.md`
4. 기술 부채: `FRONTEND_TECH_DEBT.md`
5. 계약 원문: `PROJECT_SPEC.md`
