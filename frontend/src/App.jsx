import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { RefreshCw, Coins, ChevronRight } from 'lucide-react';
import './styles/App.css';

const EXCHANGE_RATE = 1380; 

export default function App() {
  const [allEntries, setAllEntries] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [price, setPrice] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

 const BASE_URL = import.meta.env.VITE_STATIC_BASE_URL;

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/static/manifest.json?t=${Date.now()}`);
      const entries = res.data.entries || [];
      setAllEntries(entries);
      
      const currentEntry = entries.find(e => e.symbol === selectedSymbol);
      if (currentEntry) {
        const status = (currentEntry.prediction?.status || currentEntry.status || '').toLowerCase();
        if (status === 'fresh') {
          const safeSymbol = selectedSymbol || 'BTC/USDT';
          const fileName = `prediction_${safeSymbol.replace('/', '_')}_${timeframe}.json`;
          try {
            const priceRes = await axios.get(`${BASE_URL}/static/${fileName}?t=${Date.now()}`);
            const data = priceRes.data;
            if (data.forecast && Array.isArray(data.forecast) && data.forecast.length > 0) {
              const currentData = data.forecast[0]; 
              const dollarPrice = currentData.yhat || currentData.close || currentData.price || 0;
              console.log("🔥 원본 달러 가격:", dollarPrice, "달러");
              setPrice(dollarPrice * EXCHANGE_RATE);
              const krwHistory = data.forecast.map(item => (item.yhat || item.close || item.price || 0) * EXCHANGE_RATE);
              setHistory(krwHistory.slice(0, 14)); 
            }
          } catch (e) {
            console.error(e);
          }
        } else {
           setPrice(null); 
        }
      }
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("연결 확인 중...");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedSymbol, timeframe]);

  const safeSymbol = selectedSymbol || '---';
  const displaySymbol = safeSymbol.split('/')[0];
  const strokeColor = safeSymbol.includes('BTC') ? "#7dd3fc" : "#f472b6";

  const { path, points } = useMemo(() => {
    if (!history || history.length < 2) return { path: "", points: [] };
    const width = 300;
    const height = 60;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) || 1;
    const pts = history.map((val, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return { x, y, val, i };
    });
    const p = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
    return { path: p, points: pts };
  }, [history]);
  if (loading) {
    return (
      <div className="app-container">
        {/* 상단 탭 로딩 뼈대 */}
        <div className="tabs-container lg:hidden no-scrollbar flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-20 bg-slate-800/60 rounded-xl animate-pulse"></div>
          ))}
        </div>

        <main className="main-layout">
          {/* 왼쪽 코인 리스트 로딩 뼈대 */}
          <aside className="coin-list-side">
            <div className="h-8 w-40 bg-slate-800/60 rounded-lg animate-pulse mb-6"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-full bg-slate-800/40 rounded-2xl animate-pulse mb-3"></div>
            ))}
          </aside>
          
          {/* 오른쪽 메인 카드 로딩 뼈대 */}
          <div className="glass-card">
            <div className="flex justify-between items-start mb-10">
              <div className="w-14 h-14 bg-slate-800/60 rounded-2xl animate-pulse"></div>
              <div className="w-24 h-8 bg-slate-800/60 rounded-full animate-pulse"></div>
            </div>
            
            <div className="mb-8">
              <div className="h-3 w-32 bg-slate-800/40 rounded mb-3 animate-pulse"></div>
              {/* 타임프레임 버튼 뼈대 */}
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-12 bg-slate-800/60 rounded-lg animate-pulse"></div>
                <div className="h-6 w-12 bg-slate-800/60 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-12 w-64 bg-slate-800/60 rounded-lg animate-pulse mb-4"></div>
            </div>

            {/* 차트 영역 뼈대 */}
            <div className="h-24 w-full bg-slate-800/30 rounded-xl animate-pulse mb-10"></div>
            
            {/* 버튼 뼈대 */}
            <div className="h-14 w-full bg-slate-800/80 rounded-2xl animate-pulse"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="tabs-container lg:hidden no-scrollbar">
        {allEntries
          .filter((entry, index, self) => index === self.findIndex((t) => t.symbol === entry.symbol))
          .map((entry) => (
            <button
              key={entry.key || entry.symbol}
              onClick={() => setSelectedSymbol(entry.symbol || 'BTC/USDT')}
              className={`tab-button ${selectedSymbol === entry.symbol ? 'active' : 'inactive'}`}
            >
              {entry.symbol ? entry.symbol.split('/')[0] : 'Coin'}
            </button>
          ))}
      </div>
      <main className="main-layout">
        <aside className="coin-list-side">
          <h2 className="text-2xl font-black mb-6 opacity-90 tracking-tight">Market Overview</h2>
          {allEntries
            .filter((entry, index, self) => index === self.findIndex((t) => t.symbol === entry.symbol))
            .map((entry) => {
              const status = (entry.prediction?.status || entry.status || 'missing').toLowerCase();
              const isFresh = status === 'fresh';
              return (
                <div 
                  key={entry.key || entry.symbol}
                  onClick={() => setSelectedSymbol(entry.symbol || 'BTC/USDT')}
                  className={`mini-coin-card ${selectedSymbol === entry.symbol ? 'active' : ''}`}
                >
                  <div>
                    <p className="font-bold text-lg">{entry.symbol ? entry.symbol.split('/')[0] : '---'}</p>
                    <p className="text-[10px] text-slate-400 font-bold">1H INTERVAL</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className={`text-[10px] font-bold ${isFresh ? 'text-emerald-400' : 'text-slate-500'}`}>
                        ● {status.toUpperCase()}
                      </p>
                    </div>
                    <ChevronRight size={16} className="opacity-30" />
                  </div>
                </div>
              );
            })}
        </aside>
        <div className="glass-card">
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-4 rounded-2xl shadow-lg">
              <Coins size={28} />
            </div>
            <div className="bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <span className="text-emerald-400 flex items-center text-[10px] font-black uppercase tracking-wider">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                Live Terminal
              </span>
            </div>
          </div>
          <div className="mb-8 relative z-10">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
              {displaySymbol} Price Index
            </p>
            <div className="flex gap-2 mb-4">
              {['1h','1d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                    timeframe === tf 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-white">
                {price !== null ? price.toLocaleString('ko-KR', { maximumFractionDigits: price < 1000 ? 2 : 0 }) : "---"}
              </span>
              <span className="text-slate-500 font-bold text-lg">KRW</span>
            </div>
          </div>
          <div className="mb-10 opacity-80 relative z-10">
            <svg 
              className="w-full h-16 overflow-visible" 
              viewBox="0 0 300 60"
              onMouseLeave={() => setTooltip(null)}
            >
              <path d={path} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" className="sparkline-path" />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="8"
                  fill="transparent"
                  onMouseEnter={() => setTooltip(p)}
                  className="cursor-pointer"
                />
              ))}
              {tooltip && (
                <g>
                  <circle cx={tooltip.x} cy={tooltip.y} r="3" fill="#fff" />
                  <rect
                    x={tooltip.x > 200 ? tooltip.x - 75 : tooltip.x + 10}
                    y={tooltip.y - 10}
                    width="65"
                    height="18"
                    fill="#1e293b"
                    rx="4"
                  />
                  <text
                    x={tooltip.x > 200 ? tooltip.x - 42 : tooltip.x + 42}
                    y={tooltip.y + 2}
                    fill="#fff"
                    fontSize="9"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {tooltip.val.toLocaleString('ko-KR', { maximumFractionDigits: tooltip.val < 1000 ? 2 : 0 })}
                  </text>
                </g>
              )}
            </svg>
          </div>
          <button onClick={fetchAllData} className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> 데이터 갱신
          </button>
        </div>
      </main>
    </div>
  );
}