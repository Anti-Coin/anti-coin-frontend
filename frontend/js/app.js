import { CONFIG } from './config.js';

const BASE_URL = CONFIG.API_BASE_URL;
let myChart = null;

async function fetchChartData(symbol) {
    const statusEl = document.getElementById('status');
    statusEl.innerText = `상태: ${symbol} 불러오는 중...`;

    try {
        const response = await fetch(`${BASE_URL}/history/${symbol}`);
        if (!response.ok) throw new Error('데이터 실패');
        const responseData = await response.json();
        
        const chartData = {
            labels: responseData.data.map(item => new Date(item.timestamp).toLocaleString([], {
                month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
            })),
            values: responseData.data.map(item => item.close)
        };

        renderChart(chartData, symbol);
        statusEl.innerText = `상태: ${symbol} (휠 확대 / 드래그 이동)`;
    } catch (error) {
        statusEl.innerText = `에러: ${error.message}`;
    }
}

function renderChart(chartData, symbol) {
    const canvas = document.getElementById('predictionChart');
    const ctx = canvas.getContext('2d');
    
    if (myChart) { myChart.destroy(); }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: `${symbol} 현재 가격`,
                data: chartData.values,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                zoom: {
                    limits: {
                        x: { min: 'original', max: 'original' },
                        y: { min: 'original', max: 'original' }
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        threshold: 5,
                    },
                    zoom: {
                        wheel: { enabled: true, speed: 0.1 },
                        pinch: { enabled: true },
                        mode: 'xy',
                    }
                }
            },
            scales: {
                x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } },
                y: { beginAtZero: false, position: 'right', ticks: { callback: (v) => v.toLocaleString() } }
            }
        }
    });

    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none'; //브라우저 스크롤 방지

    canvas.onmousedown = (e) => { 
        canvas.style.cursor = 'grabbing';
    };
    
    canvas.onmouseup = () => { 
        canvas.style.cursor = 'grab'; 
    };

    // 우클릭 메뉴
    canvas.oncontextmenu = (e) => e.preventDefault();

    // 더블클릭 초기화
    canvas.ondblclick = () => { if (myChart) myChart.resetZoom(); };
}

document.getElementById('fetchBtn').addEventListener('click', () => {
    fetchChartData(document.getElementById('coinSelect').value);
});

window.addEventListener('DOMContentLoaded', () => {
    fetchChartData(document.getElementById('coinSelect').value || 'BTC/USDT');
});