import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { RefreshCw, Coins, ChevronRight } from 'lucide-react';
import './styles/App.css';

const EXCHANGE_RATE = 1380;

export default function App() {
  const [allEntries, setAllEntries] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [price, setPrice] = useState(null);
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost/static/manifest.json?t=${Date.now()}`);
      const entries = res.data.entries || [];
      setAllEntries(entries);
      
      const currentEntry = entries.find(e => e.symbol === selectedSymbol);
      if (currentEntry) {
        const safeSymbol = selectedSymbol.replace('/', '_');
        
        try {
          const [histRes, predRes] = await Promise.allSettled([
            axios.get(`http://localhost/static/history_${safeSymbol}_1h.json?t=${Date.now()}`),
            axios.get(`http://localhost/static/prediction_${safeSymbol}_1h.json?t=${Date.now()}`)
          ]);

          let hData = [];
          let pData = [];

          if (histRes.status === 'fulfilled') {
            hData = (histRes.value.data.data || []).slice(-24).map(d => ({
              // 🔥 어떤 이름으로 오든 다 잡아내는 무적의 그물
              val: Number(d.close || d.price || d.value || 0) * EXCHANGE_RATE,
              type: 'history',
              label: '과거 기록'
            }));
          }

          if (predRes.status === 'fulfilled') {
            pData = (predRes.value.data.forecast || []).slice(0, 12).map(d => {
              // 🔥 실수로 빼먹었던 price 복구 완료!
              const rawVal = d.yhat || d.close || d.price || d.value || 0; 
              return {
                val: Number(rawVal) * EXCHANGE_RATE,
                type: 'prediction',
                label: 'AI 예측'
              };
            });
          }

          // 🔥 만약 예측이 없으면 과거 마지막 가격을 현재가로 표시
          const latestPrice = pData.length > 0 ? pData[0].val : (hData.length > 0 ? hData[hData.length-1].val : null);
          setPrice(!isNaN(latestPrice) ? latestPrice : null);
          setCombinedData([...hData, ...pData]);

        } catch (e) {
          console.error("파일 로드 중 오류:", e);
        }
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedSymbol]);

  const { histPath, predPath, points, nowX } = useMemo(() => {
    const validData = combinedData.filter(d => !isNaN(d.val) && d.val !== null);
    if (!validData.length) return { histPath: "", predPath: "", points: [], nowX: 0 };
    
    const width = 300;
    const height = 60;
    const values = validData.map(d => d.val);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;

    const pts = validData.map((d, i) => ({
      x: (i / (validData.length - 1)) * width,
      y: height - ((d.val - min) / range) * height,
      val: d.val,
      type: d.type,
      label: d.label
    }));

    const hPts = pts.filter(p => p.type === 'history');
    const pPts = pts.filter(p => p.type === 'prediction');
    const pPathPts = hPts.length > 0 ? [hPts[hPts.length - 1], ...pPts] : pPts;

    return {
      histPath: hPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "),
      predPath: pPathPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "),
      points: pts,
      nowX: hPts.length > 0 ? hPts[hPts.length - 1].x : 0
    };
  }, [combinedData]);

  const strokeColor = selectedSymbol.includes('BTC') ? "#7dd3fc" : "#f472b6";

  return (
    <div className="app-container">
      <main className="main-layout">
        <aside className="coin-list-side">
          <h2 className="text-2xl font-black mb-6 opacity-90 tracking-tight">Market Overview</h2>
          {allEntries.map((entry) => (
            <div key={entry.key} onClick={() => setSelectedSymbol(entry.symbol)} className={`mini-coin-card ${selectedSymbol === entry.symbol ? 'active' : ''}`}>
              <div>
                <p className="font-bold text-lg">{entry.symbol.split('/')[0]}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">1h interval</p>
              </div>
              <ChevronRight size={16} className="opacity-30" />
            </div>
          ))}
        </aside>

        <div className="glass-card">
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-4 rounded-2xl shadow-lg"><Coins size={28} /></div>
            <div className="bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <span className="text-emerald-400 flex items-center text-[10px] font-black uppercase tracking-wider animate-pulse">
                Live Terminal
              </span>
            </div>
          </div>
          
          <div className="mb-8 relative z-10">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{selectedSymbol.split('/')[0]} Price Index</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-white">
                {price !== null && !isNaN(price) ? price.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) : "---"}
              </span>
              <span className="text-slate-500 font-bold text-lg">KRW</span>
            </div>
          </div>

          <div className="mb-10 opacity-80 relative z-10">
            <svg className="w-full h-16 overflow-visible" viewBox="0 0 300 60" onMouseLeave={() => setTooltip(null)}>
              <line x1={nowX} y1="0" x2={nowX} y2="60" className="now-line" />
              
              <path d={histPath} fill="none" className="path-history" />
              <path d={predPath} fill="none" stroke={strokeColor} className="path-prediction" />
              
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="6" onMouseEnter={() => setTooltip(p)} className="hover-target" fill="transparent" style={{cursor: 'pointer'}} />
              ))}

              {tooltip && (
                <g>
                  <circle cx={tooltip.x} cy={tooltip.y} r="3" className="tooltip-dot" />
                  <rect x={tooltip.x > 220 ? tooltip.x - 85 : tooltip.x + 5} y={tooltip.y - 30} width="80" height="25" rx="4" className="tooltip-bg" />
                  <text x={tooltip.x > 220 ? tooltip.x - 45 : tooltip.x + 45} y={tooltip.y - 13} className="tooltip-text">
                    {tooltip.val.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                  </text>
                  <text x={tooltip.x > 220 ? tooltip.x - 45 : tooltip.x + 45} y={tooltip.y - 2} fill="#94a3b8" fontSize="7" textAnchor="middle" fontWeight="bold">
                    {tooltip.label}
                  </text>
                </g>
              )}
            </svg>
            <div className="flex justify-between text-[8px] font-bold text-slate-500 mt-2 uppercase tracking-tighter">
              <span>24h ago</span>
              <span style={{ transform: `translateX(${nowX - 150}px)` }}>Now</span>
              <span>12h later</span>
            </div>
          </div>

          <button onClick={fetchAllData} className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> 데이터 갱신
          </button>
        </div>
      </main>
    </div>
  );
}