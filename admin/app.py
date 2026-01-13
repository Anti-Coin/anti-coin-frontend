import streamlit as st
import pandas as pd
from services import fetch_ohlcv, train_prophet_model, make_forecast
from utils import plot_plotly_chart

# 페이지 설정
st.set_page_config(page_title="Coin Forecast MVP", layout="wide")

st.title("Crypto Forecast Center")
st.markdown("### 코인 가격 예측 모니터링 시스템")

# 사이드바 설정
st.sidebar.header("Control Panel")
symbol = st.sidebar.selectbox(
    "Select Coin", ["BTC/USDT", "ETH/USDT", "XRP/USDT", "SOL/USDT"]
)
hours_to_predict = st.sidebar.slider("Prediction Hours", 6, 48, 24)

# 메인 로직 실행
with st.spinner(f"Fetching data for {symbol}..."):
    try:
        # 1. 데이터 수집
        df = fetch_ohlcv(symbol)

        # 최신 가격 표시 (KPI)
        last_price = df.iloc[-1]["close"]
        prev_price = df.iloc[-2]["close"]
        delta = last_price - prev_price

        col1, col2, col3 = st.columns(3)
        col1.metric("Current Price", f"${last_price:,.2f}", f"{delta:+.2f}")
        col2.metric("Data Points", len(df), "1h Interval")
        col3.metric("Model Status", "Active", "Prophet")

        # 2. 모델 학습
        model = train_prophet_model(df)

        # 3. 예측
        forecast = make_forecast(model, periods=hours_to_predict)

        # 4. 시각화
        st.subheader(f"📈 {symbol} Forecast Analysis")
        plot_plotly_chart(df, forecast, symbol)

        # 5. 상세 데이터
        with st.expander("View Raw Forecast Data"):
            st.dataframe(forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(10))

    except Exception as e:
        st.error(f"System Error: {e}")
