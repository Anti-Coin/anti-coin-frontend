async function fetchPrediction(symbol) {
    // 슬래시(/)가 포함된 심볼을 안전하게 인코딩 (BTC/USDT -> BTC%2FUSDT)
    const encodedSymbol = encodeURIComponent(symbol);
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/predict/${encodedSymbol}`);
        if (!response.ok) throw new Error('데이터를 불러올 수 없습니다 (404).');
        return await response.json();
    } catch (error) {
        console.error('API 에러:', error);
        return null;
    }
}