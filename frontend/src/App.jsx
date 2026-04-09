import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { RefreshCw, Coins, ChevronRight } from 'lucide-react';
import './styles/App.css';

const EXCHANGE_RATE = 1380; 

export default function App() {
  const [allEntries, setAllEntries] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [price, setPrice] = useState(null);
  const [history, setHistory] = useState([98000000, 98100000, 97900000, 98450000]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [tooltip, setTooltip] = useState(null);

  const fetchAllData = async () => {
    try {
      const res = await axios.get(`http://localhost/static/manifest.json?t=${Date.now()}`);
      const entries = res.data.entries || [];
      setAllEntries(entries);
      
      const currentEntry = entries.find(e => e.symbol === selectedSymbol);
      if (currentEntry) {
        const isFresh = (currentEntry.prediction?.status || currentEntry.status) === 'fresh';
        
        if (isFresh) {
          const safeSymbol = selectedSymbol || 'BTC/USDT';
          const fileName = `prediction_${safeSymbol.replace('/', '_')}_1h.json`; 
          try {
            const priceRes = await axios.get(`http://localhost/static/${fileName}?t=${Date.now()}`);
            const data = priceRes.data;
            
            if (data.forecast && Array.isArray(data.forecast) && data.forecast.length > 0) {
              const currentData = data.forecast[0]; 
              const dollarPrice = currentData.yhat || currentData.close || currentData.price || 0;
              const krwPrice = dollarPrice * EXCHANGE_RATE;
              
              setPrice(krwPrice);
              
              const krwHistory = data.forecast.map(item => {
                const val = item.yhat || item.close || item.price || 0;
                return val * EXCHANGE_RATE;
              });
              setHistory(krwHistory.slice(0, 14)); 
            }
          } catch (e) {
            console.error("가격 파일 가져오기 실패:", e);
          }
        } else {
           setPrice(null); 
        }
      }
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("데이터 연결 확인 중...");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedSymbol]);

  const safeSymbol = selectedSymbol || '---';
  const displaySymbol = safeSymbol.split('/')[0];
  const strokeColor = safeSymbol.includes('BTC') ? "#7dd3fc" : "#f472b6";

  // 🔥 기존 buildLinePath 함수 대신, 마우스 좌표를 계산하도록 업그레이드!
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

  return (
    <div className="app-container">
      <div className="tabs-container lg:hidden no-scrollbar">
        {allEntries.map((entry) => (
          <button
            key={entry.key}
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
          {allEntries.map((entry) => {
            const status = (entry.prediction?.status || entry.status || 'missing').toLowerCase();
            const isFresh = status === 'fresh';

            return (
              <div 
                key={entry.key}
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
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-white">
                {price !== null ? price.toLocaleString('ko-KR', { maximumFractionDigits: price < 1000 ? 2 : 0 }) : "---"}
              </span>
              <span className="text-slate-500 font-bold text-lg">KRW</span>
            </div>
          </div>

          {/* 🔥 툴팁이 추가된 그래프 영역 */}
          <div className="mb-10 opacity-80 relative z-10">
            <svg 
              className="w-full h-16 overflow-visible" 
              viewBox="0 0 300 60"
              onMouseLeave={() => setTooltip(null)} // 마우스가 밖으로 나가면 툴팁 끄기
            >
              <path d={path} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" className="sparkline-path" />
              
              {/* 마우스를 감지하는 투명한 점들 */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="8" // 마우스가 잘 닿도록 크게 잡음 (투명)
                  fill="transparent"
                  onMouseEnter={() => setTooltip(p)}
                  className="cursor-pointer hover:stroke-white hover:stroke-2"
                />
              ))}

              {/* 툴팁 말풍선 그리기 */}
              {tooltip && (
                <g>
                  {/* 선택된 위치에 하얀 점 콕! 찍어주기 */}
                  <circle cx={tooltip.x} cy={tooltip.y} r="3" fill="#fff" />
                  
                  {/* 말풍선 배경 네모 */}
                  <rect
                    x={tooltip.x > 200 ? tooltip.x - 75 : tooltip.x + 10} // 화면 밖으로 안 나가게 조절
                    y={tooltip.y - 10}
                    width="65"
                    height="18"
                    fill="#1e293b"
                    rx="4"
                  />
                  
                  {/* 말풍선 안의 가격 텍스트 */}
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