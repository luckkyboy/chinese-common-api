# chinese-common-api

一个基于 TypeScript + Hono 的通用中文数据 API 服务
支持 Cloudflare Workers 和 Node/Docker 双运行环境。

## API
> [!note]
> 接口地址：[https://api.luckkyboy.workers.dev](https://api.luckkyboy.workers.dev)
>
> 所有接口同时支持GET+URL参数 + POST body两种方式获取数据。

* 接口当前支持： 
  * 全国油价查询
    * `GET /oil-price?query=北京`
  * 头一天热点新闻查询
    * `GET /news?query=YYYY-MM-DD`

## 本地开发

```bash
npm install
npm run dev
```

默认端口 `8787`。

## 构建与运行（Node/Docker）

```bash
npm run build
npm run start
```

Docker:

```bash
docker build -t chinese-common-api .
docker run --rm -p 8787:8787 chinese-common-api
```

## Cloudflare Workers

```bash
npm run deploy
```
