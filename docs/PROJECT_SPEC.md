# Project Spec (Backend Contract + Product Goals)

- Last Updated (UTC): 2026-03-02
- Scope: 새 프로젝트 시작을 위한 기준 문서

## 1) 우리가 만들고자 하는 것 (목표)

1. 사용자가 심볼/타임프레임별 히스토리와 예측 상태를 신뢰할 수 있게 보여주는 읽기 전용 화면.
2. 데이터 노출 정책을 절대 위반하지 않는 UI (`serve_allowed` 최종 게이트).
3. 무료 티어 환경에서도 안정적으로 동작하는 정적 우선(static-first) 구조.

## 2) 백엔드에서 FE로 제공되는 데이터 (확정 계약)

### 2.1 기본 경로

- Manifest: `/static/manifest.json`
- History: `/static/history_{SAFE_SYMBOL}_{TIMEFRAME}.json`
- Prediction: `/static/prediction_{SAFE_SYMBOL}_{TIMEFRAME}.json`

`SAFE_SYMBOL = symbol.replace("/", "_")`

예: `BTC/USDT` -> `BTC_USDT`

### 2.2 금지/보조 엔드포인트

- 금지: `/history`, `/predict` (사용 금지)
- 보조: `/status/{symbol}?timeframe=...`는 운영 신호/배너 보강용
  - 노출 게이트 판정 근거는 `manifest`를 유지

### 2.3 핵심 필드 규칙

- `visibility`: `visible | hidden_backfilling`
- `prediction.status`: `fresh | stale | hard_stale | corrupt | missing`
- `serve_allowed`: 최종 노출 게이트
  - 의미: `true`는 `visibility=visible` + `prediction.status in {fresh, stale}`일 때만
- `degraded`: freshness와 별개 품질 경고 신호
- `updated_at`: ISO-8601 UTC with `Z` (`YYYY-MM-DDTHH:MM:SSZ`)
- `version`: manifest top-level integer (현재 1)

## 3) FE 노출 정책 (반드시 지킬 것)

1. `serve_allowed=false`면 항상 차단 UI.
2. `visibility=hidden_backfilling`이면 심볼 목록/카드에서 숨김.
3. `prediction.status=fresh|stale`면 노출 가능 (`stale`은 경고 표시).
4. `prediction.status=hard_stale|corrupt|missing`면 차단 UI.
5. `degraded=true`는 별도 경고 배지로 표시.

## 4) 샘플 데이터

### 4.1 manifest.json

```json
{
  "version": 1,
  "entries": [
    {
      "key": "DOGE/USDT|1w",
      "symbol": "DOGE/USDT",
      "timeframe": "1w",
      "history": {
        "updated_at": "2026-03-02T00:49:46Z",
        "source_file": "history_DOGE_USDT_1w.json"
      },
      "prediction": {
        "status": "fresh",
        "updated_at": "2026-03-02T00:49:46Z",
        "age_minutes": 10.5,
        "threshold_minutes": {
          "soft": 11520,
          "hard": 23040
        },
        "source_detail": "checked=prediction_DOGE_USDT_1w.json"
      },
      "degraded": false,
      "last_prediction_success_at": "2026-03-02T00:49:46Z",
      "last_prediction_failure_at": null,
      "prediction_failure_count": 0,
      "visibility": "visible",
      "symbol_state": "ready_for_serving",
      "is_full_backfilled": true,
      "coverage_start_at": "2019-07-05T12:00:00Z",
      "coverage_end_at": "2026-03-01T23:00:00Z",
      "exchange_earliest_at": "2019-07-05T12:00:00Z",
      "serve_allowed": true
    },
    {
      "key": "DOGE/USDT|1M",
      "symbol": "DOGE/USDT",
      "timeframe": "1M",
      "history": {
        "updated_at": "2026-03-02T00:49:47Z",
        "source_file": "history_DOGE_USDT_1M.json"
      },
      "prediction": {
        "status": "fresh",
        "updated_at": "2026-03-02T00:49:47Z",
        "age_minutes": 10.49,
        "threshold_minutes": {
          "soft": 50400,
          "hard": 100800
        },
        "source_detail": "checked=prediction_DOGE_USDT_1M.json"
      },
      "degraded": false,
      "last_prediction_success_at": "2026-03-02T00:49:48Z",
      "last_prediction_failure_at": null,
      "prediction_failure_count": 0,
      "visibility": "visible",
      "symbol_state": "ready_for_serving",
      "is_full_backfilled": true,
      "coverage_start_at": "2019-07-05T12:00:00Z",
      "coverage_end_at": "2026-03-01T23:00:00Z",
      "exchange_earliest_at": "2019-07-05T12:00:00Z",
      "serve_allowed": true
    }
  ],
  "summary": {
    "entry_count": 20,
    "status_counts": {
      "fresh": 20
    },
    "degraded_count": 0,
    "visible_symbol_count": 5,
    "hidden_symbol_count": 0,
    "symbol_state_counts": {
      "ready_for_serving": 5
    }
  }
}
```

### 4.2 history_{SYMBOL}_{TIMEFRAME}.json 예시

```json
{
  "symbol": "BTC/USDT",
  "timeframe": "1w",
  "type": "history_1w",
  "updated_at": "2026-02-26T13:16:24Z",
  "data": [
    {
      "timestamp": "2026-02-02T00:00:00Z",
      "open": 76968.22,
      "high": 79360.0,
      "low": 60000.0,
      "close": 70330.38,
      "volume": 384283.11539
    },
    {
      "timestamp": "2026-02-09T00:00:00Z",
      "open": 70330.38,
      "high": 71453.53,
      "low": 65118.0,
      "close": 68832.58,
      "volume": 163165.87355
    }
  ]
}
```

### 4.3 prediction_{SYMBOL}_{TIMEFRAME}.json 예시

```json
{
  "symbol": "BTC/USDT",
  "timeframe": "1w",
  "updated_at": "2026-03-02T00:00:32Z",
  "forecast": [
    {
      "timestamp": "2026-06-22T00:00:00Z",
      "price": 169491.56660596884,
      "lower_bound": -251734.11684892973,
      "upper_bound": 598682.5521794488
    },
    {
      "timestamp": "2026-06-29T00:00:00Z",
      "price": 174738.7285316537,
      "lower_bound": -272511.5865181296,
      "upper_bound": 642867.3516146205
    }
  ]
}
```