import { Hono } from "hono";
import { cors } from "hono/cors";
import { initializeRuntimeConfig, initializeRuntimeEnv, type EnvSource } from "./config.js";
import { apiRouter } from "./router.js";

export function createApp(env?: EnvSource) {
  initializeRuntimeEnv(env);
  const app = new Hono();
  const runtimeConfig = initializeRuntimeConfig(env);

  app.use("*", cors());

  app.use("*", async (c, next) => {
    c.header("Content-Type", "application/json; charset=utf-8");
    await next();
  });

  app.use("*", async (c, next) => {
    const ip =
      c.req.header("cf-connecting-ip") ??
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      "";
    if (ip && runtimeConfig.blacklistedIps.includes(ip)) {
      return c.json(
        {
          code: 403,
          message: "访问被拒绝",
          data: null,
        },
        403
      );
    }
    await next();
  });

  app.use("*", async (c, next) => {
    const debug = runtimeConfig.debugEnabled || c.req.query("debug") === "1";
    const startedAt = Date.now();
    await next();
    if (debug) {
      c.header("x-debug", "1");
      c.header("x-response-time-ms", String(Date.now() - startedAt));
    }
  });

  app.route("/", apiRouter);

  app.notFound((c) => {
    return c.json(
      {
        code: 404,
        message: "接口不存在",
        data: {
          path: c.req.path,
        },
      },
      404
    );
  });

  app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return c.json(
      {
        code: 500,
        message: "服务器内部错误",
        data: null,
      },
      500
    );
  });

  return app;
}
