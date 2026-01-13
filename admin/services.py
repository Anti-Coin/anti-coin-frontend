import ccxt
import pandas as pd
from prophet import Prophet
import streamlit as st


@st.cache_data(ttl=300)
def fetch_ohlcv(symbol="BTC/USDT", timeframe="1h", limit=500):
    exchange = ccxt.binance()
    ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
    df = pd.DataFrame(
        ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"]
    )
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    return df


@st.cache_resource  # 모델은 메모리에
def train_prophet_model(df):
    train_df = df[["timestamp", "close"]].rename(
        columns={"timestamp": "ds", "close": "y"}
    )
    model = Prophet(daily_seasonality=True, yearly_seasonality=False)
    model.fit(train_df)
    return model


def make_forecast(model, periods=24):
    future = model.make_future_dataframe(periods=periods, freq="H")
    forecast = model.predict(future)
    return forecast
