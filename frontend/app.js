const BASE_URL = 'http://127.0.0.1:8000';

/**
 * 1. 과거 차트 데이터 가져오기
 */
export async function getHistory(symbol) {
    // 백엔드 경로 형식 /history/{symbol} 에 맞게 호출
    const res = await fetch(`${BASE_URL}/history/${encodeURIComponent(symbol)}`);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || '과거 데이터를 불러오지 못했습니다.');
    }
    return res.json();
}

/**
 * 2. 가격 예측 데이터 가져오기
 */
export async function getPrediction(symbol) {
    // 백엔드 경로 형식 /predict/{symbol} 에 맞게 호출
    const res = await fetch(`${BASE_URL}/predict/${encodeURIComponent(symbol)}`);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || '예측 데이터를 불러오지 못했습니다.');
    }
    return res.json();
}

/**
 * 3. 데이터 신선도 상태 확인 (새로 추가된 기능)
 */
export async function getSystemStatus(symbol) {
    const res = await fetch(`${BASE_URL}/status/${encodeURIComponent(symbol)}`);
    if (!res.ok) {
        const errorData = await res.json();
        return { status: 'error', message: errorData.detail };
    }
    return res.json();
}

export const CONFIG = {
    API_BASE_URL: BASE_URL,
    DEFAULT_SYMBOL: 'BTC/USDT'
};