let runtimeEnv: Record<string, unknown> | undefined;

export function setRuntimeEnv(env: Record<string, unknown> | undefined) {
  runtimeEnv = env;
}

export function getEnv(key: string): string | undefined {
  const runtimeValue = runtimeEnv?.[key];
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

function getBooleanEnv(key: string, fallback: boolean): boolean {
  const value = getEnv(key);
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
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
    name: "chinese-common-api",
    author: "luckkyboy",
    github: "https://github.com/luckkyboy/chinese-common-api",
  },
  overseas: {
    get flag() {
      return getBooleanEnv("overseas_flag", true);
    },
    rawBaseUrl: "https://raw.githubusercontent.com/${repo}/refs/heads/${branch}/${path}",
    chinaRawBaseUrl: "https://cdn.jsdmirror.com/gh/${repo}@${branch}/${path}",
  },
  oilPrice: {
    repo: "luckkyboy/chinese-oil-price-data",
    branch: "main",
    dataBasePath: "data",
    latestPointerPath: "data/prices/latest.json",
    localRegionsFile: "src/modules/oil-price/regions.json",
  },
  resultMessage: "获取成功！项目可以私有化部署，项目地址：https://github.com/luckkyboy/chinese-common-api",
} as const;
