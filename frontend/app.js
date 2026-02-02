import { CONFIG } from './config.js';

// 1. 설정값 가져오기 (보안을 위해 config.js 사용)
const BASE_URL = CONFIG.API_BASE_URL; 
let myChart = null;

/**
 * 2. API 호출 함수 (공통화)
 */
async function getHistory(symbol) {
    const res = await fetch(`${BASE_URL}/history/${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error(`과거 데이터 요청 실패: ${res.status}`);
    return res.json();
}

async function getPrediction(symbol) {
    const res = await fetch(`${BASE_URL}/predict/${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error(`예측 데이터 요청 실패: ${res.status}`);
    return res.json();
}

/**
 * 3. 메인 데이터 로드 함수
 */
async function fetchData() {
    const symbol = document.getElementById('coinSelect').value;
    const status = document.getElementById('status');
    
    status.innerHTML = `<span style="color: #3861fb;">⌛ ${symbol} 데이터를 분석 중입니다...</span>`;

    try {
        // 병렬로 데이터 호출
        const [historyJson, predictJson] = await Promise.all([
            getHistory(symbol),
            getPrediction(symbol)
        ]);

        const historyData = historyJson.data || [];
        const forecastData = predictJson.forecast || [];

        if (historyData.length === 0 && forecastData.length === 0) {
            throw new Error("DB에 저장된 데이터가 없습니다.");
        }

        updateChart(symbol, historyData, forecastData);
        status.innerHTML = `<span style="color: #4caf50;">✅ 업데이트 완료: ${new Date().toLocaleTimeString()}</span>`;

    } catch (err) {
        console.error("Fetch Error:", err);
        status.innerHTML = `<span style="color: #ff4d4d;">❌ 에러: ${err.message}</span>`;
    }
}

/**
 * 4. 차트 업데이트 함수
 */
function updateChart(symbol, history, forecast) {
    const ctx = document.getElementById('predictionChart').getContext('2d');
    
    if (myChart) {
        myChart.destroy();
    }

    // 시간 축 라벨 생성
    const labels = [
        ...history.map(d => new Date(d.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })),
        ...forecast.map(d => new Date(d.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
    ];

    // 데이터셋 구성
    const historyDataset = [
        ...history.map(d => d.close),
        ...forecast.map(() => null)
    ];

    const forecastDataset = [
        ...history.map((d, i) => i === history.length - 1 ? d.close : null),
        ...forecast.map(d => d.yhat)
    ];

    const upperDataset = [
        ...history.map(() => null),
        ...forecast.map(d => d.yhat_upper)
    ];

    const lowerDataset = [
        ...history.map(() => null),
        ...forecast.map(d => d.yhat_lower)
    ];

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '실제 가격',
                    data: historyDataset,
                    borderColor: '#1a73e8', // 시인성을 위해 파란색 계열로 변경
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'AI 예측가',
                    data: forecastDataset,
                    borderColor: '#3861fb',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 2,
                    fill: false
                },
                {
                    label: '예측 상한선',
                    data: upperDataset,
                    borderColor: 'transparent',
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: '오차 범위',
                    data: lowerDataset,
                    borderColor: 'transparent',
                    pointRadius: 0,
                    backgroundColor: 'rgba(56, 97, 251, 0.1)',
                    fill: '-1' // upperDataset과의 사이를 채움
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, ticks: { color: '#666' } }, // 다크모드가 아니면 어두운 글자색 권장
                y: { position: 'right', grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#666' } }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#333',
                        filter: (item) => !item.text.includes('상한선') && !item.text.includes('범위')
                    }
                }
            }
        }
    });
}

// 이벤트 리스너 설정
document.getElementById('fetchBtn').addEventListener('click', fetchData);
window.onload = fetchData;