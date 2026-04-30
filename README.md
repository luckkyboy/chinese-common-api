# chinese-common-api

一个基于 TypeScript + Hono 的通用中文数据 API 服务
支持 Cloudflare Workers 和 Node/Docker 双运行环境。

> [!note]
> 接口地址：[https://api.luckkyboy.workers.dev](https://api.luckkyboy.workers.dev)

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

## API

- `GET /oil-price?query=北京`
- `POST /oil-price`，Body: `{ "query": "北京" }`
- `GET /news`（默认返回当天数据；当天缺失时回退到前一天）
- `GET /news?query=YYYY-MM-DD`
- `POST /news`，Body: `{ "query": "YYYY-MM-DD" }`
