function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process?.env) {
    return process.env[key];
  }
  return undefined;
}

export const config = {
  server: {
    host: getEnv("HOST") ?? "0.0.0.0",
    port: Number(getEnv("PORT") ?? 8787),
  },
  app: {
    name: "chinese-common-api",
    author: "luckkyboy",
    github: "https://github.com/luckkyboy/chinese-common-api",
  },
  overseas: {
    flag: getEnv("overseas_flag") ?? true,
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
