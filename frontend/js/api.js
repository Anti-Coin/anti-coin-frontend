import { CONFIG } from './config.js'; 

const BASE_URL = CONFIG.API_BASE_URL;

export async function getHistory(symbol) {
    const res = await fetch(`${BASE_URL}/history/${encodeURIComponent(symbol)}`);
    return res.json();
}

export async function getPrediction(symbol) {
    const res = await fetch(`${BASE_URL}/predict/${encodeURIComponent(symbol)}`);
    return res.json();
}