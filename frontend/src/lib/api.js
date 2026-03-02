import { appConfig, buildStaticUrl, buildStatusUrl, toSafeSymbol } from "./config";

const BLOCK_STATUSES = new Set(["hard_stale", "corrupt", "missing"]);

export class ContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "ContractError";
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} at ${url}`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchJsonWithRetry(url, { timeoutMs, backoffStepsMs }) {
  let lastError = null;
  for (let index = 0; index <= backoffStepsMs.length; index += 1) {
    try {
      return await fetchJson(url, timeoutMs);
    } catch (error) {
      lastError = error;
      if (index === backoffStepsMs.length) {
        break;
      }
      await sleep(backoffStepsMs[index]);
    }
  }
  throw lastError || new Error(`Request failed: ${url}`);
}

function readIsoUtc(value) {
  if (typeof value !== "string" || !value.endsWith("Z")) {
    return null;
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return null;
  }
  return value;
}

function normalizeManifestEntry(raw) {
  if (!raw || typeof raw !== "object") {
    throw new ContractError("Manifest entry must be an object.");
  }
  if (typeof raw.key !== "string") {
    throw new ContractError("Manifest entry missing key.");
  }
  if (typeof raw.symbol !== "string" || typeof raw.timeframe !== "string") {
    throw new ContractError(`Manifest entry(${raw.key}) missing symbol/timeframe.`);
  }
  if (!raw.prediction || typeof raw.prediction !== "object") {
    throw new ContractError(`Manifest entry(${raw.key}) missing prediction.`);
  }
  const status = raw.prediction.status;
  if (typeof status !== "string") {
    throw new ContractError(`Manifest entry(${raw.key}) missing prediction.status.`);
  }

  const visibility = raw.visibility === "hidden_backfilling" ? "hidden_backfilling" : "visible";
  const serveAllowed = Boolean(raw.serve_allowed);
  const isBlockedByStatus = BLOCK_STATUSES.has(status);
  const contractAllowsServing = visibility === "visible" && serveAllowed && !isBlockedByStatus;
  const blockReason = !serveAllowed
    ? "serve_allowed=false"
    : isBlockedByStatus
      ? status
      : visibility === "hidden_backfilling"
        ? "hidden_backfilling"
        : null;

  const predictionUpdatedAt = readIsoUtc(raw.prediction.updated_at);
  const historyUpdatedAt = readIsoUtc(raw.history?.updated_at);

  return {
    key: raw.key,
    symbol: raw.symbol,
    safeSymbol: toSafeSymbol(raw.symbol),
    timeframe: raw.timeframe,
    visibility,
    status,
    degraded: Boolean(raw.degraded),
    serveAllowed: contractAllowsServing,
    rawServeAllowed: serveAllowed,
    blockReason,
    predictionUpdatedAt,
    historyUpdatedAt,
    lastPredictionSuccessAt: readIsoUtc(raw.last_prediction_success_at),
    lastPredictionFailureAt: readIsoUtc(raw.last_prediction_failure_at),
    predictionFailureCount: Number.isFinite(Number(raw.prediction_failure_count))
      ? Number(raw.prediction_failure_count)
      : 0,
    thresholdSoftMinutes: Number(raw.prediction?.threshold_minutes?.soft) || null,
    thresholdHardMinutes: Number(raw.prediction?.threshold_minutes?.hard) || null,
    fingerprint: [
      predictionUpdatedAt || "none",
      historyUpdatedAt || "none",
      status,
      serveAllowed ? "1" : "0",
      visibility,
      raw.degraded ? "1" : "0",
    ].join("|"),
  };
}

export function parseManifest(payload) {
  if (!payload || typeof payload !== "object") {
    throw new ContractError("Manifest payload must be an object.");
  }
  if (!Array.isArray(payload.entries)) {
    throw new ContractError("Manifest payload missing entries array.");
  }

  const normalized = [];
  const invalidEntries = [];
  for (const entry of payload.entries) {
    try {
      normalized.push(normalizeManifestEntry(entry));
    } catch (error) {
      invalidEntries.push({
        key: entry?.key ?? "unknown",
        reason: error instanceof Error ? error.message : "Unknown parsing error",
      });
    }
  }

  return {
    version: Number(payload.version) || 0,
    generatedAt: readIsoUtc(payload.generated_at),
    summary: payload.summary && typeof payload.summary === "object" ? payload.summary : {},
    entries: normalized,
    invalidEntries,
  };
}

function normalizeHistory(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
    throw new ContractError("History payload missing data array.");
  }
  const data = payload.data
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      timestamp: readIsoUtc(item.timestamp),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume),
    }))
    .filter(
      (item) =>
        item.timestamp &&
        Number.isFinite(item.open) &&
        Number.isFinite(item.high) &&
        Number.isFinite(item.low) &&
        Number.isFinite(item.close) &&
        Number.isFinite(item.volume)
    );

  return {
    symbol: typeof payload.symbol === "string" ? payload.symbol : null,
    timeframe: typeof payload.timeframe === "string" ? payload.timeframe : null,
    updatedAt: readIsoUtc(payload.updated_at),
    data,
  };
}

function normalizePrediction(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.forecast)) {
    throw new ContractError("Prediction payload missing forecast array.");
  }
  const forecast = payload.forecast
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      timestamp: readIsoUtc(item.timestamp),
      price: Number(item.price),
      lowerBound: Number(item.lower_bound),
      upperBound: Number(item.upper_bound),
    }))
    .filter(
      (item) =>
        item.timestamp &&
        Number.isFinite(item.price) &&
        Number.isFinite(item.lowerBound) &&
        Number.isFinite(item.upperBound)
    );

  return {
    symbol: typeof payload.symbol === "string" ? payload.symbol : null,
    timeframe: typeof payload.timeframe === "string" ? payload.timeframe : null,
    updatedAt: readIsoUtc(payload.updated_at),
    forecast,
  };
}

function normalizeStatus(payload) {
  if (!payload || typeof payload !== "object") {
    throw new ContractError("Status payload must be an object.");
  }

  return {
    status: typeof payload.status === "string" ? payload.status : "unknown",
    updatedAt: readIsoUtc(payload.updated_at),
    ageMinutes: Number.isFinite(Number(payload.age_minutes))
      ? Number(payload.age_minutes)
      : null,
    degraded: Boolean(payload.degraded),
    degradedReason:
      typeof payload.degraded_reason === "string" ? payload.degraded_reason : null,
    warning: typeof payload.warning === "string" ? payload.warning : null,
    raw: payload,
  };
}

export async function fetchManifestContract() {
  const payload = await fetchJsonWithRetry(buildStaticUrl(appConfig.manifestFileName), {
    timeoutMs: appConfig.requestTimeoutMs,
    backoffStepsMs: appConfig.backoffStepsMs,
  });
  return parseManifest(payload);
}

export async function fetchHistory(symbol, timeframe) {
  const fileName = `history_${toSafeSymbol(symbol)}_${timeframe}.json`;
  const payload = await fetchJsonWithRetry(buildStaticUrl(fileName), {
    timeoutMs: appConfig.requestTimeoutMs,
    backoffStepsMs: appConfig.backoffStepsMs,
  });
  return normalizeHistory(payload);
}

export async function fetchPrediction(symbol, timeframe) {
  const fileName = `prediction_${toSafeSymbol(symbol)}_${timeframe}.json`;
  const payload = await fetchJsonWithRetry(buildStaticUrl(fileName), {
    timeoutMs: appConfig.requestTimeoutMs,
    backoffStepsMs: appConfig.backoffStepsMs,
  });
  return normalizePrediction(payload);
}

export async function fetchStatus(symbol, timeframe) {
  const payload = await fetchJsonWithRetry(buildStatusUrl(symbol, timeframe), {
    timeoutMs: appConfig.requestTimeoutMs,
    backoffStepsMs: appConfig.backoffStepsMs,
  });
  return normalizeStatus(payload);
}
