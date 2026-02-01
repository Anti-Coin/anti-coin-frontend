function renderChart(data) {
    const ctx = document.getElementById('coinChart').getContext('2d');
    // 실제 데이터와 예측 데이터(yhat), 신뢰구간(yhat_upper, lower) 추출
    const labels = data.map(item => item.timestamp);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'AI 예측가(yhat)',
                data: data.map(item => item.yhat),
                borderColor: 'blue',
                fill: false
            }, {
                label: '신뢰 구간(Upper/Lower)',
                data: data.map(item => item.yhat_upper),
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                fill: '+1', // lower와 사이를 채움
                borderWidth: 0
            }, {
                data: data.map(item => item.yhat_lower),
                fill: false,
                borderWidth: 0
            }]
        }
    });
}