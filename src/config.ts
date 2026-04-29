export type EnvSource = Record<string, unknown> | undefined;
let initializedEnvSnapshot: Readonly<Record<string, unknown>> | undefined;
let initializedRuntimeConfig: RuntimeConfig | undefined;

export function initializeRuntimeEnv(env?: EnvSource) {
  if (!initializedEnvSnapshot && env) {
    initializedEnvSnapshot = Object.freeze({ ...env });
  }
}

export function getEnv(key: string, env?: EnvSource): string | undefined {
  const runtimeValue = env?.[key] ?? initializedEnvSnapshot?.[key];
  if (typeof runtimeValue === "string") {
    return runtimeValue;
  }
  if (typeof runtimeValue === "number" || typeof runtimeValue === "boolean") {
    return String(runtimeValue);
  }
  if (typeof process !== "undefined" && process?.env) {
    return process.env[key];
  }
  return undefined;
}

function getBooleanEnv(key: string, fallback: boolean, env?: EnvSource): boolean {
  const value = getEnv(key, env);
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

export interface RuntimeConfig {
  blacklistedIps: string[];
  debugEnabled: boolean;
  overseasFlag: boolean;
}

export function createRuntimeConfig(env?: EnvSource): RuntimeConfig {
  const blacklistedIps = (getEnv("BLACKLIST_IPS", env) ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const debugEnabled = (getEnv("DEBUG", env) ?? "").trim().toLowerCase() === "1";
  const overseasFlag = getBooleanEnv("overseas_flag", true, env);
  return Object.freeze({
    blacklistedIps,
    debugEnabled,
    overseasFlag,
  });
}

export function initializeRuntimeConfig(env?: EnvSource): RuntimeConfig {
  if (!initializedRuntimeConfig) {
    initializedRuntimeConfig = createRuntimeConfig(env);
  }
  return initializedRuntimeConfig;
}

export function getRuntimeConfig(): RuntimeConfig {
  return initializedRuntimeConfig ?? createRuntimeConfig();
}

export const config = {
  server: {
    get host() {
      return getEnv("HOST") ?? "0.0.0.0";
    },
    get port() {
      return Number(getEnv("PORT") ?? 8787);
    },
  },
  app: {
    name: "common-api",
    author: "luckkyboy",
    github: "https://github.com/luckkyboy/chinese-common-api",
  },
  overseas: {
    rawBaseUrl: "https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/${path}",
    chinaRawBaseUrl: "https://cdn.jsdmirror.com/gh/${repo}@${branch}/${path}",
  },
  oilPrice: {
    repo: "luckkyboy/chinese-oil-price-data",
    branch: "main",
    dataRootPath: "data",
    latestPointerPath: "data/prices/latest.json",
  },
  newsData: {
    repo: "luckkyboy/news-data",
    branch: "main",
    path: "static/news/${date}.json",
  },
  resultMessage: "获取成功！项目可以私有化部署，项目地址：https://github.com/luckkyboy/chinese-common-api",
} as const;
