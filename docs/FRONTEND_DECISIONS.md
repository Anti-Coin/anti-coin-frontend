# Frontend Decision Register

- Last Updated (UTC): 2026-03-02
- Scope: Active frontend decisions only

| ID | Topic | Current Rule | Revisit Trigger |
|---|---|---|---|
| FD-2026-03-02-01 | Stack | React + Vite 고정 | SSR/SEO 요구가 제품 목표로 추가될 때 |
| FD-2026-03-02-02 | Deployment | FE/BE 분리 서버 고정 | 단일 도메인 통합 배포 필요 시 |
| FD-2026-03-02-03 | Contract Source | FE는 `PROJECT_SPEC`의 공개 계약만 소비 | 계약 버전/필드 변경 시 |
| FD-2026-03-02-04 | Visibility Policy | `hidden_backfilling` 완전 비노출 | 정책 변경 시 |
| FD-2026-03-02-05 | Exposure Policy | `serve_allowed=false`는 표시+비활성(진입 차단) | 사용자 혼선/이탈 증가 시 |
| FD-2026-03-02-06 | Status Policy | `stale`는 경고 후 노출, `hard_stale/corrupt/missing`은 차단 | 상태 의미론 변경 시 |
| FD-2026-03-02-07 | Polling Baseline | manifest=120s, status=60s, hidden tab=600s | 반영 지연/요청량 이탈 시 |
| FD-2026-03-02-08 | Optimization Policy | 최적화는 측정 기반으로 F4 이후 착수 | 명확한 병목 신호가 관측될 때 |

## Operation Policy
1. 정책 변경은 이 문서를 먼저 갱신한다.
2. 변경된 정책은 `FRONTEND_PLAN_LIVING`과 `FRONTEND_TASKS`에 동기화한다.
