import { useEffect, useMemo, useRef, useState } from "react";
import { appConfig } from "./lib/config";
import {
  ContractError,
  fetchHistory,
  fetchManifestContract,
  fetchPrediction,
  fetchStatus,
} from "./lib/api";

function numberText(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function timeText(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("ko-KR", { hour12: false });
}

function buildLinePath(values, width, height) {
  if (!Array.isArray(values) || values.length < 2) {
    return "";
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function PriceSparkline({ values }) {
  if (!values || values.length < 2) {
    return <div className="empty-inline">Not enough points</div>;
  }
  const path = buildLinePath(values, 340, 90);
  return (
    <svg className="sparkline" viewBox="0 0 340 90" role="img" aria-label="Price trend">
      <defs>
        <linearGradient id="sparkLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#sparkLineGradient)" strokeWidth="2.8" />
    </svg>
  );
}

export default function App() {
  const [manifestState, setManifestState] = useState({
    loading: true,
    error: null,
    generatedAt: null,
    entries: [],
    invalidEntries: [],
  });
  const [selectedKey, setSelectedKey] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [timeframeFilter, setTimeframeFilter] = useState("ALL");
  const [detailState, setDetailState] = useState({
    loading: false,
    error: null,
    history: null,
    prediction: null,
    status: null,
    sourceFingerprint: null,
  });

  const entryFingerprintsRef = useRef(new Map());
  const selectedKeyRef = useRef(null);

  useEffect(() => {
    selectedKeyRef.current = selectedKey;
  }, [selectedKey]);

  useEffect(() => {
    let cancelled = false;

    const pollManifest = async () => {
      try {
        const payload = await fetchManifestContract();
        if (cancelled) {
          return;
        }

        const changedKeys = new Set();
        const nextMap = new Map();
        for (const entry of payload.entries) {
          nextMap.set(entry.key, entry.fingerprint);
          if (entryFingerprintsRef.current.get(entry.key) !== entry.fingerprint) {
            changedKeys.add(entry.key);
          }
        }
        entryFingerprintsRef.current = nextMap;

        const nextEntries = payload.entries.filter(
          (entry) => entry.visibility !== "hidden_backfilling"
        );
        const selectedStillExists = nextEntries.some(
          (entry) => entry.key === selectedKeyRef.current
        );
        if (!selectedStillExists) {
          setSelectedKey(null);
        }

        setManifestState({
          loading: false,
          error: null,
          generatedAt: payload.generatedAt,
          entries: nextEntries,
          invalidEntries: payload.invalidEntries,
        });

        if (selectedKeyRef.current && changedKeys.has(selectedKeyRef.current)) {
          setDetailState((prev) => ({ ...prev, sourceFingerprint: null }));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setManifestState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown manifest error",
        }));
      }
    };

    pollManifest();

    const getManifestInterval = () =>
      document.hidden ? appConfig.hiddenTabManifestPollMs : appConfig.manifestPollMs;

    let timer = window.setInterval(pollManifest, getManifestInterval());
    const onVisibilityChange = () => {
      window.clearInterval(timer);
      timer = window.setInterval(pollManifest, getManifestInterval());
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const selectedEntry = useMemo(
    () => manifestState.entries.find((entry) => entry.key === selectedKey) || null,
    [manifestState.entries, selectedKey]
  );

  useEffect(() => {
    let cancelled = false;
    if (!selectedEntry) {
      setDetailState({
        loading: false,
        error: null,
        history: null,
        prediction: null,
        status: null,
        sourceFingerprint: null,
      });
      return;
    }

    if (!selectedEntry.serveAllowed) {
      setDetailState({
        loading: false,
        error: `Blocked by policy: ${selectedEntry.blockReason || "not_available"}`,
        history: null,
        prediction: null,
        status: null,
        sourceFingerprint: selectedEntry.fingerprint,
      });
      return;
    }

    if (detailState.sourceFingerprint === selectedEntry.fingerprint) {
      return;
    }

    const loadDetail = async () => {
      setDetailState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));
      try {
        const [history, prediction, status] = await Promise.all([
          fetchHistory(selectedEntry.symbol, selectedEntry.timeframe),
          fetchPrediction(selectedEntry.symbol, selectedEntry.timeframe),
          fetchStatus(selectedEntry.symbol, selectedEntry.timeframe),
        ]);
        if (cancelled) {
          return;
        }
        setDetailState({
          loading: false,
          error: null,
          history,
          prediction,
          status,
          sourceFingerprint: selectedEntry.fingerprint,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof ContractError
            ? `Contract error: ${error.message}`
            : error instanceof Error
              ? error.message
              : "Unknown detail error";
        setDetailState((prev) => ({
          ...prev,
          loading: false,
          error: message,
          sourceFingerprint: selectedEntry.fingerprint,
        }));
      }
    };

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedEntry, detailState.sourceFingerprint]);

  useEffect(() => {
    if (!selectedEntry || !selectedEntry.serveAllowed) {
      return;
    }

    let cancelled = false;
    const pollStatus = async () => {
      try {
        const status = await fetchStatus(selectedEntry.symbol, selectedEntry.timeframe);
        if (cancelled) {
          return;
        }
        setDetailState((prev) => ({
          ...prev,
          status,
        }));
      } catch (error) {
        if (cancelled) {
          return;
        }
        setDetailState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Status polling failed",
        }));
      }
    };

    const timer = window.setInterval(pollStatus, appConfig.statusPollMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedEntry]);

  const timeframes = useMemo(() => {
    const set = new Set();
    for (const entry of manifestState.entries) {
      set.add(entry.timeframe);
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [manifestState.entries]);

  const filteredEntries = useMemo(() => {
    const keyword = searchText.trim().toUpperCase();
    return manifestState.entries.filter((entry) => {
      if (timeframeFilter !== "ALL" && entry.timeframe !== timeframeFilter) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return (
        entry.symbol.toUpperCase().includes(keyword) ||
        entry.timeframe.toUpperCase().includes(keyword)
      );
    });
  }, [manifestState.entries, searchText, timeframeFilter]);

  const summary = useMemo(() => {
    const counts = {
      total: filteredEntries.length,
      fresh: 0,
      stale: 0,
      blocked: 0,
      degraded: 0,
    };
    for (const entry of filteredEntries) {
      if (entry.status === "fresh") {
        counts.fresh += 1;
      }
      if (entry.status === "stale") {
        counts.stale += 1;
      }
      if (!entry.serveAllowed) {
        counts.blocked += 1;
      }
      if (entry.degraded) {
        counts.degraded += 1;
      }
    }
    return counts;
  }, [filteredEntries]);

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">AIOps User Plane</p>
        <h1>Anti-Coin Frontend Console</h1>
        <p className="subtext">
          Backend-blind UI. Contract first. Fail closed on wrong exposure.
        </p>
        <div className="hero-meta">
          <span>Manifest: {timeText(manifestState.generatedAt)}</span>
          <span>Manifest Poll: {appConfig.manifestPollMs / 1000}s</span>
          <span>Status Poll: {appConfig.statusPollMs / 1000}s</span>
        </div>
      </header>

      <section className="summary-grid">
        <article className="summary-card">
          <h2>Total</h2>
          <p>{summary.total}</p>
        </article>
        <article className="summary-card">
          <h2>Fresh</h2>
          <p>{summary.fresh}</p>
        </article>
        <article className="summary-card">
          <h2>Stale</h2>
          <p>{summary.stale}</p>
        </article>
        <article className="summary-card">
          <h2>Blocked</h2>
          <p>{summary.blocked}</p>
        </article>
      </section>

      <section className="panel controls">
        <label>
          Search
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="BTC, DOGE, 1h..."
          />
        </label>
        <label>
          Timeframe
          <select
            value={timeframeFilter}
            onChange={(event) => setTimeframeFilter(event.target.value)}
          >
            {timeframes.map((timeframe) => (
              <option key={timeframe} value={timeframe}>
                {timeframe}
              </option>
            ))}
          </select>
        </label>
      </section>

      {manifestState.error && (
        <section className="panel error-panel">
          <strong>Manifest Error</strong>
          <p>{manifestState.error}</p>
        </section>
      )}

      {manifestState.invalidEntries.length > 0 && (
        <section className="panel warning-panel">
          <strong>Contract Warning</strong>
          <p>{manifestState.invalidEntries.length} entries were dropped due to contract mismatch.</p>
        </section>
      )}

      <section className="panel">
        <h2>Market Overview</h2>
        {manifestState.loading ? (
          <p className="muted">Loading manifest...</p>
        ) : filteredEntries.length === 0 ? (
          <p className="muted">No visible entries for current filter.</p>
        ) : (
          <div className="entry-grid">
            {filteredEntries.map((entry, index) => (
              <article
                className={`entry-card ${selectedEntry?.key === entry.key ? "active" : ""}`}
                key={entry.key}
                style={{ animationDelay: `${40 * (index % 10)}ms` }}
              >
                <div className="entry-head">
                  <h3>{entry.symbol}</h3>
                  <span className="timeframe-pill">{entry.timeframe}</span>
                </div>
                <div className="badge-row">
                  <span className={`badge status-${entry.status}`}>{entry.status}</span>
                  {entry.degraded && <span className="badge degraded">degraded</span>}
                  {!entry.serveAllowed && <span className="badge blocked">blocked</span>}
                </div>
                <p className="meta-line">Prediction: {timeText(entry.predictionUpdatedAt)}</p>
                <p className="meta-line">History: {timeText(entry.historyUpdatedAt)}</p>
                <button
                  className="open-btn"
                  disabled={!entry.serveAllowed}
                  onClick={() => setSelectedKey(entry.key)}
                >
                  {entry.serveAllowed
                    ? "Open Detail"
                    : `Blocked (${entry.blockReason || "policy"})`}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel detail-panel">
        <h2>Symbol Detail</h2>
        {!selectedEntry ? (
          <p className="muted">Select an available entry from Market Overview.</p>
        ) : (
          <>
            <div className="detail-head">
              <h3>
                {selectedEntry.symbol} / {selectedEntry.timeframe}
              </h3>
              <div className="badge-row">
                <span className={`badge status-${selectedEntry.status}`}>
                  {selectedEntry.status}
                </span>
                {detailState.status?.degraded && (
                  <span className="badge degraded">degraded</span>
                )}
              </div>
            </div>
            {detailState.loading && <p className="muted">Loading detail payloads...</p>}
            {detailState.error && <p className="error-text">{detailState.error}</p>}
            {!detailState.loading && !detailState.error && detailState.history && detailState.prediction && (
              <div className="detail-grid">
                <article className="detail-card">
                  <h4>History Close Trend</h4>
                  <PriceSparkline
                    values={detailState.history.data.slice(-120).map((item) => item.close)}
                  />
                  <p className="meta-line">
                    points: {detailState.history.data.length} / updated:{" "}
                    {timeText(detailState.history.updatedAt)}
                  </p>
                </article>
                <article className="detail-card">
                  <h4>Forecast Price Trend</h4>
                  <PriceSparkline
                    values={detailState.prediction.forecast.slice(-60).map((item) => item.price)}
                  />
                  <p className="meta-line">
                    points: {detailState.prediction.forecast.length} / updated:{" "}
                    {timeText(detailState.prediction.updatedAt)}
                  </p>
                </article>
                <article className="detail-card">
                  <h4>Status Signal</h4>
                  <p className="meta-line">status: {detailState.status?.status || "-"}</p>
                  <p className="meta-line">
                    age minutes: {numberText(detailState.status?.ageMinutes, 1)}
                  </p>
                  <p className="meta-line">
                    updated: {timeText(detailState.status?.updatedAt)}
                  </p>
                  {detailState.status?.warning && (
                    <p className="warning-text">{detailState.status.warning}</p>
                  )}
                  {detailState.status?.degradedReason && (
                    <p className="warning-text">degraded: {detailState.status.degradedReason}</p>
                  )}
                </article>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
