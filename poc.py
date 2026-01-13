import ccxt
import pandas as pd
from prophet import Prophet
import matplotlib.pyplot as plt
import time


def fetch_data(symbol="BTC/USDT", timeframe="1h", limit=500):
    print(f"[{symbol}] 바이낸스에서 데이터 수집 중...")
    exchange = ccxt.binance()
    # OHLCV 데이터 가져오기
    ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)

    # 데이터프레임 변환
    df = pd.DataFrame(
        ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"]
    )
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")

    print(f"데이터 수집 완료 ({len(df)}개 행)")
    return df


def train_and_predict(df):
    print("Prophet 모델 학습 시작...")

    # Prophet은 컬럼명이 무조건 'ds', 'y'여야 함
    train_df = df[["timestamp", "close"]].rename(
        columns={"timestamp": "ds", "close": "y"}
    )

    # 모델 초기화 및 학습
    model = Prophet(daily_seasonality=True)
    model.fit(train_df)

    # 미래 24시간 데이터프레임 생성
    future = model.make_future_dataframe(periods=24, freq="H")

    # 예측
    forecast = model.predict(future)
    print("예측 완료!")

    return model, forecast


def visualize(model, forecast, symbol):
    print("차트 그리는 중...")
    # Prophet 내장 플로팅
    fig1 = model.plot(forecast)
    plt.title(f"{symbol} Price Forecast (Next 24 Hours)")
    plt.xlabel("Date")
    plt.ylabel("Price (USDT)")

    # 화면에 띄우기
    plt.show()


if __name__ == "__main__":
    try:
        start_time = time.time()

        # 1. 수집
        symbol = "BTC/USDT"
        df = fetch_data(symbol)

        # 2. 학습 및 예측
        model, forecast = train_and_predict(df)

        # 3. 결과 확인 (마지막 5개 데이터)
        print("\n--- [Prediction Result (Next 5 hours)] ---")
        print(forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail())

        # 4. 시각화
        visualize(model, forecast, symbol)

        print(f"\n전체 소요 시간: {time.time() - start_time:.2f}초")

    except Exception as e:
        print(f"에러 발생: {e}")
