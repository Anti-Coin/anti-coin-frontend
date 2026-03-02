# Frontend Documentation Index

- Last Updated (UTC): 2026-03-02
- Purpose: FE 계획/결정/토론/부채 문서를 분리 운영하기 위한 허브

## 1) Read Order (Default)
1. `PROJECT_SPEC.md`
2. `FRONTEND_PLAN_LIVING.md`
3. `FRONTEND_TASKS.md`
4. `FRONTEND_DECISIONS.md`
5. `FRONTEND_DISCUSSION.md`
6. `FRONTEND_TECH_DEBT.md`

## 2) Document Roles
1. `PROJECT_SPEC.md`
   - 백엔드 공개 계약(입력 계약 단일 출처)
2. `FRONTEND_PLAN_LIVING.md`
   - 큰 계획(Phase), 일정, 최적화 착수 기준
3. `FRONTEND_TASKS.md`
   - 작은 계획(Wave) + 원자 Task 실행 보드
4. `FRONTEND_DECISIONS.md`
   - 현재 유효한 FE 결정 요약
5. `FRONTEND_DISCUSSION.md`
   - 구현 전 쟁점/가설/옵션 비교
6. `FRONTEND_TECH_DEBT.md`
   - 부채 목록, 리스크, 해소 계획

## 3) Update Rules
1. 정책 변경:
   - `FRONTEND_DECISIONS.md` 먼저 갱신
2. 계획/우선순위 변경:
   - `FRONTEND_PLAN_LIVING.md` + `FRONTEND_TASKS.md` 동기화
3. 구현 전 쟁점:
   - `FRONTEND_DISCUSSION.md` 기록 후 Task 승격
4. 부채 생성/해소:
   - `FRONTEND_TECH_DEBT.md` 즉시 갱신
5. 계약 변경:
   - `PROJECT_SPEC.md` 우선 갱신 후 나머지 문서 정합성 반영
