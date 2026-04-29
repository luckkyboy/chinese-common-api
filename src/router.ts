import { Hono } from "hono";
import { getAppInfo, getRegisteredEndpoints } from "./common.js";
import { handleQuery } from "./modules/oil-price/handler.js";

export const apiRouter = new Hono();

apiRouter.get("/", (c) => {
  return c.json({
    code: 200,
    message: "获取成功",
    data: {
      app: getAppInfo(),
      endpoints: getRegisteredEndpoints(apiRouter),
    },
  });
});

apiRouter.get("/oil-price", async (c) => {
  return handleQuery(c);
});

apiRouter.post("/oil-price", async (c) => {
  return handleQuery(c);
});
