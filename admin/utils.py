import plotly.graph_objs as go
import streamlit as st


def plot_plotly_chart(df, forecast, symbol):
    # 실제 데이터 (과거)
    trace_actual = go.Scatter(
        x=df["timestamp"],
        y=df["close"],
        mode="lines",
        name="Actual Price",
        line=dict(color="#1f77b4"),
    )

    # 예측 데이터 (미래)
    # forecast['ds'] 중 마지막 부분만 잘라서 연결감을 줌
    future_forecast = forecast[forecast["ds"] > df["timestamp"].max()]

    trace_predicted = go.Scatter(
        x=future_forecast["ds"],
        y=future_forecast["yhat"],
        mode="lines",
        name="Predicted Price",
        line=dict(color="#ff7f0e", dash="dot"),
    )

    # 신뢰 구간 (Upper/Lower Bound)
    trace_upper = go.Scatter(
        x=future_forecast["ds"],
        y=future_forecast["yhat_upper"],
        mode="lines",
        line=dict(width=0),
        showlegend=False,
        hoverinfo="skip",
    )

    trace_lower = go.Scatter(
        x=future_forecast["ds"],
        y=future_forecast["yhat_lower"],
        mode="lines",
        line=dict(width=0),
        fill="tonexty",  # Upper와 Lower 사이를 채움
        fillcolor="rgba(255, 127, 14, 0.2)",
        name="Confidence Interval",
    )

    layout = go.Layout(
        title=f"{symbol} AI Forecast (Prophet)",
        xaxis=dict(title="Time"),
        yaxis=dict(title="Price (USDT)"),
        hovermode="x",
        template="plotly_dark",
    )

    fig = go.Figure(
        data=[trace_actual, trace_upper, trace_lower, trace_predicted], layout=layout
    )
    st.plotly_chart(fig, use_container_width=True)
