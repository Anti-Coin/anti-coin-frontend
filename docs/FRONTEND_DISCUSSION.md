# Frontend Discussion Log

- Last Updated (UTC): 2026-03-02
- Purpose: 구현 전 쟁점/옵션/근거를 기록하고 Task 승격 근거로 사용

## Entry 2026-03-02 — Polling Gap vs Cost
1. Topic:
   - 상태 반영 지연과 요청량 절감의 균형
2. Observed Facts:
   - 5분 폴링은 상태 miss gap 우려가 있음
   - 60초 전체 폴링은 free-tier 요청량 증가 우려가 있음
3. Options:
   - A) 전부 60초
   - B) 전부 300초
   - C) manifest 120초 + status 60초 + hidden tab 600초
4. Recommendation:
   - C 채택: 데이터 무게를 분리해 안정성과 비용 균형 확보
5. Follow-up:
   - `FE-003`, `FE-006`, `FE-008`

## Entry 2026-03-02 — Hard Fail UX
1. Topic:
   - hard 상태 항목을 숨길지, 보이되 차단할지
2. Observed Facts:
   - 완전 숨김은 "왜 안 보이는지" 원인 전달이 어려움
   - 노출 허용은 wrong exposure 위험
3. Options:
   - A) hard 항목 완전 숨김
   - B) 목록 표시 + 진입 차단 + 사유 배지
4. Recommendation:
   - B 채택: 사용자에게 상태를 숨기지 않으면서 노출 정책을 지킴
5. Follow-up:
   - `FE-004`, `FE-007`

## Entry 2026-03-02 — Optimization Start Timing
1. Topic:
   - 최적화를 언제 시작할지
2. Observed Facts:
   - 초기 단계에서 최적화 선행 시 구조 복잡도 증가 가능
3. Options:
   - A) F1부터 병행 최적화
   - B) F4 완료 후 측정 기반 착수
4. Recommendation:
   - B 채택: 기능/정책/검증 기준선 확보 후 착수
5. Follow-up:
   - `FE-011`, `FD-2026-03-02-08`
