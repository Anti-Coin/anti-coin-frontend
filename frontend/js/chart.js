// 데이터를 받아온 뒤 차트를 그리는 로직 예시
const labels = data.map(item => new Date(item.timestamp).toLocaleTimeString()); // 시간 표시
const prices = data.map(item => item.close); // 종가(close) 데이터 추출

new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'ETH/USDT 가격',
            data: prices,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    }
});