export const config = {
  server: {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 8787),
  },
  app: {
    name: "chinese-common-api",
    author: "luckkyboy",
    github: "https://github.com/luckkyboy/chinese-common-api",
  },
  overseas: {
    flag: process.env.overseas_flag ?? true,
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
