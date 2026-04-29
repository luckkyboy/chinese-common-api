# chinese-common-api

TypeScript + Hono + Fetch 标准接口，同时支持 Cloudflare Workers 与 Docker/Node 运行。

## 目录

- `src/app.ts` 全局中间件/错误处理/路由挂载
- `src/router.ts` API 路由定义
- `src/worker.ts` Cloudflare Workers 入口
- `src/server.ts` Node/Docker 入口
- `src/modules/oil-price/data-store.ts` 数据加载与缓存
- `src/modules/oil-price/handler.ts` 油价业务处理

## 数据来源

- latest 指针：`https://raw.githubusercontent.com/luckkyboy/chinese-oil-price-data/refs/heads/main/data/prices/latest.json`
- prices 文件：`https://raw.githubusercontent.com/luckkyboy/chinese-oil-price-data/refs/heads/main/data/prices/` + latest 字段
- regions：本地文件 `src/modules/oil-price/regions.json`

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

统一响应结构：

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "region": "北京",
    "province_code": "110000",
    "zone_code": "default",
    "province_name": "北京市",
    "zone_name": "默认价区",
    "items": [
      { "code": "0", "name": "0#柴油", "price": "8.2" },
      { "code": "89", "name": "89#汽油", "price": "7.92" },
      { "code": "92", "name": "92#汽油", "price": "8.46" },
      { "code": "95", "name": "95#汽油", "price": "9.01" }
    ],
    "unit": "CNY/L",
    "currency": "CNY",
    "adjustment_date": "2026-04-21",
    "effective_from": "2026-04-22T00:00:00+08:00",
    "timezone": "Asia/Shanghai",
    "missing_products": [],
    "latest_updated_at": "2026-04-27T20:40:57+08:00"
  }
}
```
