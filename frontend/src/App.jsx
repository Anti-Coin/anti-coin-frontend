﻿import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { RefreshCw, Coins, ChevronRight, Search, Terminal, Activity } from 'lucide-react';
import './styles/App.css';

const EXCHANGE_RATE = Number(import.meta.env.VITE_EXCHANGE_RATE) || 1380;
const BASE_URL = import.meta.env.VITE_STATIC_BASE_URL;

const getFormattedTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function App() {
  const [allEntries, setAllEntries] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [price, setPrice] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [logs, setLogs] = useState([
    { id: 1, time: getFormattedTime(), msg: '터미널 초기화 완료.', type: 'info' }
  ]);
  const logsEndRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [
      ...prev,
      { id: Date.now(), time: getFormattedTime(), msg, type }
    ].slice(-50));
  };

  const theme = {
    bg: 'bg-slate-900',
    text: 'text-white',
    textMuted: 'text-slate-400',
    card: 'bg-slate-800/80 border-slate-700/50',
    input: 'bg-slate-800/80 text-white border-slate-700/50',
    btnBase: 'bg-slate-800 text-slate-400 hover:bg-slate-700',
    refreshBtn: 'bg-white text-slate-950',
    tooltipBg: '#1e293b',
    tooltipText: '#ffffff',
    skeletonBase: 'bg-slate-800/60',
    skeletonHighlight: 'bg-slate-800/40',
    hover: 'hover:bg-slate-800/50',
    scrollbar: '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/80'
  };

  const uniqueEntries = useMemo(() => {
    return allEntries.filter((entry, index, self) => index === self.findIndex((t) => t.symbol === entry.symbol));
  }, [allEntries]);

  const filteredEntries = useMemo(() => {
    return uniqueEntries.filter(entry =>
      (entry.symbol || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueEntries, searchTerm]);

  const fetchAllData = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const res = await axios.get(`${BASE_URL}/static/manifest.json?t=${Date.now()}`);
      if (requestId !== requestIdRef.current) return;

      const entries = res.data.entries || [];
      setAllEntries(entries);

      const currentEntry = entries.find(e => e.symbol === selectedSymbol);
      if (currentEntry) {
        const status = (currentEntry.prediction?.status || currentEntry.status || '').toLowerCase();
        if (status === 'fresh') {
          const fileName = `prediction_${selectedSymbol.replace('/', '_')}_${timeframe}.json`;
          try {
            const priceRes = await axios.get(`${BASE_URL}/static/${fileName}?t=${Date.now()}`);
            if (requestId !== requestIdRef.current) return;

            const data = priceRes.data;
            if (data.forecast && Array.isArray(data.forecast) && data.forecast.length > 0) {
              const currentData = data.forecast[0];
              const dollarPrice = currentData.yhat || currentData.close || currentData.price || 0;
              setPrice(dollarPrice * EXCHANGE_RATE);
              const krwHistory = data.forecast.map(item => (item.yhat || item.close || item.price || 0) * EXCHANGE_RATE);
              setHistory(krwHistory.slice(0, 14));
              addLog(`[${selectedSymbol}] ${timeframe} 가격 렌더링 완료`, 'info');
            } else {
              setPrice(null);
              setHistory([]);
              setTooltip(null);
              addLog(`[${selectedSymbol}] Forecast 데이터가 비어 있습니다.`, 'warning');
            }
          } catch (e) {
            if (requestId !== requestIdRef.current) return;

            setPrice(null);
            setHistory([]);
            setTooltip(null);
            addLog(`[${selectedSymbol}] 상세 데이터 로드 실패`, 'error');
            console.error(e);
          }
        } else {
          setPrice(null);
          setHistory([]);
          setTooltip(null);
          addLog(`[${selectedSymbol}] 데이터가 Fresh 상태가 아닙니다.`, 'warning');
        }
      } else {
        setPrice(null);
        setHistory([]);
        setTooltip(null);
        addLog(`[${selectedSymbol}] manifest에서 항목을 찾을 수 없습니다.`, 'warning');
      }
      if (requestId !== requestIdRef.current) return;
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError("연결 확인 중....");
      setPrice(null);
      setHistory([]);
      setTooltip(null);
      addLog('API 연결 실패. 네트워크를 확인하세요...', 'error');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedSymbol, timeframe]);

  const displaySymbol = selectedSymbol.split('/')[0];
  const strokeColor = selectedSymbol.includes('BTC') ? "#7dd3fc" : "#f472b6";

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

  if (loading && allEntries.length === 0) {
    return (
      <div className={`app-container min-h-screen transition-colors duration-500 ${theme.bg}`} style={{ backgroundColor: '#0f172a' }}>
        <div className="tabs-container lg:hidden no-scrollbar flex gap-2 pt-4 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-10 w-20 rounded-xl animate-pulse ${theme.skeletonBase}`}></div>
          ))}
        </div>
        <main className="w-full relative flex flex-col lg:flex-row justify-center items-start gap-6 lg:gap-8 py-4 pl-4 pr-4 lg:pl-4 lg:pr-[336px] mt-8">
          <aside className="w-full lg:w-[280px] flex-shrink-0">
            <div className={`h-8 w-40 rounded-lg animate-pulse mb-6 ${theme.skeletonBase}`}></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-20 w-full rounded-2xl animate-pulse mb-3 ${theme.skeletonHighlight}`}></div>
            ))}
          </aside>
          <div className={`w-full lg:w-[420px] h-[480px] flex-shrink-0 glass-card rounded-3xl p-6 border ${theme.card}`}>
            <div className={`h-24 w-full rounded-xl animate-pulse mb-10 ${theme.skeletonHighlight}`}></div>
          </div>
          <aside className="hidden lg:flex lg:absolute lg:right-0 lg:top-4 w-[300px] xl:w-[320px] flex-shrink-0 flex-col gap-4">
            <div className={`h-[560px] w-full rounded-3xl animate-pulse ${theme.card}`}></div>
          </aside>
        </main>
      </div>
    );
  }

  return (
    <div className={`app-container min-h-screen transition-colors duration-500 ${theme.bg} ${theme.text}`} style={{ backgroundColor: '#0f172a' }}>

      <div className="w-full flex justify-center items-center gap-3 pt-4 lg:pt-8 px-4 z-20 relative pb-2 lg:pb-6 max-w-2xl mx-auto">
        <div className="relative w-full">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a coin..."
            className={`w-full backdrop-blur-md text-sm font-bold rounded-full pl-12 pr-6 py-3.5 border focus:outline-none focus:border-orange-500 transition-all ${theme.input}`}
          />
        </div>
      </div>

      <div className="tabs-container lg:hidden no-scrollbar px-4 pb-4">
        {uniqueEntries.map((entry) => (
          <button
            key={entry.key || entry.symbol}
            onClick={() => setSelectedSymbol(entry.symbol ?? 'BTC/USDT')}
            className={`tab-button ${selectedSymbol === entry.symbol ? 'active' : 'inactive'}`}
          >
            {entry.symbol?.split('/')[0] ?? 'Coin'}
          </button>
        ))}
      </div>

      <main className="w-full relative flex flex-col lg:flex-row justify-center items-start gap-6 lg:gap-8 py-4 pl-4 pr-4 lg:pl-4 lg:pr-[336px] mt-4 lg:mt-8">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white font-bold px-6 py-2 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce">
            ⚠️ {error}
          </div>
        )}

        <aside className="w-full lg:w-[280px] flex-shrink-0 coin-list-side">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-black opacity-90 tracking-tight">Markets</h2>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wider ${theme.btnBase}`}>
              {uniqueEntries.length} ASSETS
            </span>
          </div>
          <div className={`overflow-y-auto max-h-[480px] pr-2 ${theme.scrollbar}`}>
            {filteredEntries.map((entry) => {
              const status = (entry.prediction?.status || entry.status || 'missing').toLowerCase();
              const isFresh = status === 'fresh';
              return (
                <div
                  key={entry.key || entry.symbol}
                  onClick={() => setSelectedSymbol(entry.symbol ?? 'BTC/USDT')}
                  className={`mini-coin-card transition-all cursor-pointer rounded-2xl p-4 mb-2 flex justify-between items-center ${theme.hover} ${selectedSymbol === entry.symbol ? 'bg-slate-800 shadow-lg' : ''}`}
                >
                  <div>
                    <p className="font-bold text-lg">{entry.symbol?.split('/')[0] ?? '---'}</p>
                    <p className={`text-[10px] font-bold uppercase ${theme.textMuted}`}>{timeframe} CHART</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className={`text-[10px] font-bold ${isFresh ? 'text-emerald-500' : 'text-slate-400'}`}>
                        ● {status.toUpperCase()}
                      </p>
                    </div>
                    <ChevronRight size={16} className="opacity-30" />
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <div className={`w-full lg:w-[420px] h-auto lg:h-[480px] flex-shrink-0 glass-card transition-all duration-500 rounded-3xl p-6 border ${theme.card} flex flex-col justify-between ${loading ? 'opacity-50 pointer-events-none animate-pulse' : 'opacity-100'}`}>
          <div>
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-4 rounded-2xl shadow-lg">
                <Coins size={28} className="text-white" />
              </div>
              <div className="px-3 py-1.5 rounded-full border bg-emerald-500/20 border-emerald-500/30">
                <span className="text-emerald-500 flex items-center text-[10px] font-black uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
            <div className="mb-8 relative z-10">
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${theme.textMuted}`}>
                {displaySymbol} Price Index
              </p>
              <div className="flex gap-2 mb-4">
                {['1h', '1d'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${timeframe === tf
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 border border-orange-400'
                      : theme.btnBase
                      }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-black tracking-tighter ${theme.text}`}>
                  {price !== null ? price.toLocaleString('ko-KR', { maximumFractionDigits: price < 1000 ? 2 : 0 }) : "---"}
                </span>
                <span className={`font-bold text-lg ${theme.textMuted}`}>KRW</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-8 opacity-90 relative z-10">
              <svg className="w-full h-16 overflow-visible" viewBox="0 0 300 60" onMouseLeave={() => setTooltip(null)}>
                <path d={path} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" className="sparkline-path" />
                {points.map((p, i) => (
                  <circle
                    key={i} cx={p.x} cy={p.y} r="8" fill="transparent"
                    onMouseEnter={() => setTooltip(p)} onTouchStart={() => setTooltip(p)}
                    className="cursor-pointer"
                  />
                ))}
                {tooltip && (
                  <g>
                    <circle cx={tooltip.x} cy={tooltip.y} r="3" fill={theme.tooltipBg} stroke={strokeColor} strokeWidth="1.5" />
                    <rect
                      x={tooltip.x > 200 ? tooltip.x - 75 : tooltip.x + 10} y={tooltip.y - 10}
                      width="65" height="18" fill={theme.tooltipBg} rx="4" stroke={theme.textMuted} strokeWidth="0.5"
                    />
                    <text
                      x={tooltip.x > 200 ? tooltip.x - 42 : tooltip.x + 42} y={tooltip.y + 2}
                      fill={theme.tooltipText} fontSize="9" textAnchor="middle" fontWeight="bold"
                    >
                      {tooltip.val.toLocaleString('ko-KR', { maximumFractionDigits: tooltip.val < 1000 ? 2 : 0 })}
                    </text>
                  </g>
                )}
              </svg>
            </div>
            <button onClick={fetchAllData} className={`w-full font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${theme.refreshBtn}`}>
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> 데이터 갱신
            </button>
          </div>
        </div>

        <aside className={`hidden lg:flex lg:absolute lg:right-0 lg:top-4 w-[300px] xl:w-[320px] h-[560px] flex-shrink-0 flex-col rounded-3xl border p-5 transition-all duration-500 ${theme.card}`}>
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-700/30">
            <Terminal size={20} className="text-emerald-400" />
            <h2 className="text-sm font-black tracking-wider uppercase">System Logs</h2>
            <Activity size={14} className="ml-auto text-orange-500 animate-pulse" />
          </div>

          <div className={`flex-1 overflow-y-auto font-mono text-[11px] flex flex-col gap-3 pr-2 ${theme.scrollbar}`}>
            {logs.map((log) => {
              let color = "text-slate-300";
              if (log.type === 'success') color = "text-emerald-400 font-bold";
              if (log.type === 'warning') color = "text-orange-400 font-bold";
              if (log.type === 'error') color = "text-red-400 font-bold";

              return (
                <div key={log.id} className="flex gap-3 leading-relaxed animate-fade-in">
                  <span className="opacity-50 shrink-0 text-slate-500">
                    [{log.time}]
                  </span>
                  <span className={`${color} break-words`}>
                    {log.msg}
                  </span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </aside>

      </main>
    </div>
  );
}
