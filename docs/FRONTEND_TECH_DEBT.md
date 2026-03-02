# Frontend Tech Debt Register

- Last Updated (UTC): 2026-03-02
- Purpose: FE 부채를 누락 없이 추적

| ID | Category | Debt | Risk | Status | Linked Task | Next Action |
|---|---|---|---|---|---|---|
| FTD-001 | Architecture | push(SSE/WebSocket) 미도입 | 폴링 간격 내 반영 지연 | open | FE-008, FE-011 | 실제 지연/요청량 측정 후 필요 시 도입 판단 |
| FTD-002 | UX | 심볼 검색/정렬 고도화 미구현 | 심볼 증가 시 탐색성 저하 | open | FE-004 | 목록 사용성 관측 후 우선순위 재평가 |
| FTD-003 | Contract | 런타임 schema 검증 최소화 | 필드 누락 시 파싱 실패 가능 | open | FE-002, FE-009 | schema guard 테스트 추가 |
| FTD-004 | Testing | E2E 부재 | 회귀 누락 가능 | open | FE-009 | 핵심 시나리오 최소 E2E 정의 |
| FTD-005 | Accessibility | 접근성 기준 미완성 | 사용성/품질 저하 | open | FE-007 | 키보드/명도/스크린리더 점검 목록 추가 |

## Status Rule
1. `open`: 미해결
2. `mitigated`: 완화 조치 적용
3. `resolved`: 해소 완료
