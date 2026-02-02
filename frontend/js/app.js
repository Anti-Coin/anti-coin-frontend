import { CONFIG } from './config.js';

const BASE_URL = CONFIG.API_BASE_URL;
let myChart = null;

async function fetchChartData(symbol) {
    const statusEl = document.getElementById('status');
    statusEl.innerText = `상태: ${symbol} 데이터 불러오는 중...`;

    try {
        // config.js에 설정된 주소로 API 요청
        const response = await fetch(`${BASE_URL}/history/${symbol}`);
        if (!response.ok) throw new Error('데이터를 가져오는데 실패했습니다.');
        
        const data = await response.json();
        renderChart(data, symbol);
        statusEl.innerText = `상태: ${symbol} 조회 완료`;
    } catch (error) {
        console.error('Error:', error);
        statusEl.innerText = `상태: 에러 발생 (${error.message})`;
    }
}

function renderChart(data, symbol) {
    const ctx = document.getElementById('predictionChart').getContext('2d');
    
    // 기존 차트가 있으면 삭제 (중복 생성 방지)
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels, // 백엔드에서 준 시간 레이블
            datasets: [{
                label: `${symbol} 가격 예측`,
                data: data.values, // 백엔드에서 준 가격 데이터
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// 버튼 클릭 이벤트 리스너
document.getElementById('fetchBtn').addEventListener('click', () => {
    const symbol = document.getElementById('coinSelect').value;
    fetchChartData(symbol);
});

// 초기 실행 (기본 코인 데이터 로드)
window.addEventListener('DOMContentLoaded', () => {
    fetchChartData(CONFIG.DEFAULT_SYMBOL);
});