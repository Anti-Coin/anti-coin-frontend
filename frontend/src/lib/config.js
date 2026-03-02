function readNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function readBackoffSteps(value) {
  if (!value || typeof value !== "string") {
    return [5000, 15000, 30000, 60000];
  }
  const steps = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
  if (steps.length === 0) {
    return [5000, 15000, 30000, 60000];
  }
  return steps;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function ensureLeadingSlash(value) {
  if (!value.startsWith("/")) {
    return `/${value}`;
  }
  return value;
}

const env = import.meta.env;

const staticBaseUrl = trimTrailingSlash(
  env.VITE_STATIC_BASE_URL || "http://127.0.0.1"
);
const statusBaseUrl = trimTrailingSlash(
  env.VITE_STATUS_BASE_URL || "http://127.0.0.1:8000"
);
const staticBasePath = ensureLeadingSlash(
  env.VITE_STATIC_BASE_PATH || "/static"
);

export const appConfig = {
  staticBaseUrl,
  statusBaseUrl,
  staticBasePath,
  manifestFileName: env.VITE_MANIFEST_FILE || "manifest.json",
  manifestPollMs: readNumber(env.VITE_MANIFEST_POLL_SECONDS, 120) * 1000,
  statusPollMs: readNumber(env.VITE_STATUS_POLL_SECONDS, 60) * 1000,
  hiddenTabManifestPollMs:
    readNumber(env.VITE_BACKGROUND_MANIFEST_POLL_SECONDS, 600) * 1000,
  backoffStepsMs: readBackoffSteps(env.VITE_BACKOFF_STEPS_MS),
  requestTimeoutMs: 8000,
  primaryTimeframe: env.VITE_PRIMARY_TIMEFRAME || "1h",
};

export function buildStaticUrl(fileName) {
  return `${appConfig.staticBaseUrl}${appConfig.staticBasePath}/${fileName}`;
}

export function buildStatusUrl(symbol, timeframe) {
  const encodedSymbol = encodeURIComponent(symbol);
  const encodedTimeframe = encodeURIComponent(timeframe);
  return `${appConfig.statusBaseUrl}/status/${encodedSymbol}?timeframe=${encodedTimeframe}`;
}

export function toSafeSymbol(symbol) {
  return symbol.replaceAll("/", "_");
}
