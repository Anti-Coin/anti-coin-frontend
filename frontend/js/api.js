const BASE_URL = 'http://localhost:8000';

export async function getHistory(symbol) {
    const res = await fetch(`${BASE_URL}/history/${encodeURIComponent(symbol)}`);
    return res.json();
}

export async function getPrediction(symbol) {
    const res = await fetch(`${BASE_URL}/predict/${encodeURIComponent(symbol)}`);
    return res.json();
}