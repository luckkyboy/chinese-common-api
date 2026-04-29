import { Hono } from "hono";
import { config } from "./config.js";
import { getAppInfo, getRegisteredEndpoints } from "./common.js";
import { handleQuery as handleNewsQuery } from "./handlers/news.handler.js";
import { handleQuery as handleOilPriceQuery } from "./handlers/oil-price/oil-price.handler.js";

export const apiRouter = new Hono();

apiRouter.get("/", (c) => {
  return c.json({
    code: 200,
    message: config.resultMessage,
    data: {
      app: getAppInfo(),
      endpoints: getRegisteredEndpoints(apiRouter),
    },
  });
});

apiRouter.get("/oil-price", async (c) => {
  return handleOilPriceQuery(c);
});

apiRouter.post("/oil-price", async (c) => {
  return handleOilPriceQuery(c);
});

apiRouter.get("/news", async (c) => {
  return handleNewsQuery(c);
});

apiRouter.post("/news", async (c) => {
  return handleNewsQuery(c);
});
