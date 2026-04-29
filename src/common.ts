import { config } from "./config.js";
import type { Context, Hono } from "hono";

type GithubRawParams = {
  repo: string;
  branch: string;
  path: string;
};

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  }
  return Boolean(value);
}

function renderTemplate(template: string, params: GithubRawParams): string {
  return template
    .replaceAll("${repo}", params.repo)
    .replaceAll("${branch}", params.branch)
    .replaceAll("${path}", params.path);
}

export function buildGithubRawUrl(params: GithubRawParams): string {
  const useOverseas = toBoolean(config.overseas.flag);
  const template = useOverseas ? config.overseas.rawBaseUrl : config.overseas.chinaRawBaseUrl;
  return renderTemplate(template, params);
}

export interface AppInfo {
  name: string;
  repository: string;
  author: string;
}

export function getAppInfo(): AppInfo {
  return {
    name: config.app.name,
    author: config.app.author,
    repository: config.app.github,
  };
}

type HonoRoute = {
  method: string;
  path: string;
};

export function getRegisteredEndpoints(app: Hono): string[] {
  const routes = ((app as unknown as { routes?: HonoRoute[] }).routes ?? []).map(
    (route) => `${route.method.toUpperCase()} ${route.path}`
  );
  return [...new Set(routes)].sort();
}

export type ExtractRequestParamResult =
  | { ok: true; value: string }
  | { ok: false; status: number; message: string };

export async function extractRequestParam(
  c: Context,
  paramName: string
): Promise<ExtractRequestParamResult> {
  if (c.req.method === "GET") {
    const value = c.req.query(paramName);
    if (typeof value === "string" && value.trim() !== "") {
      return { ok: true, value };
    }
    return { ok: false, status: 400, message: `${paramName} 参数不能为空` };
  }

  if (c.req.method === "POST") {
    const body = await c.req.json<unknown>().catch(() => undefined);
    if (body === undefined) {
      return { ok: false, status: 400, message: "请求体不是合法 JSON" };
    }
    if (
      body &&
      typeof body === "object" &&
      paramName in body &&
      typeof body[paramName as keyof typeof body] === "string" &&
      String(body[paramName as keyof typeof body]).trim() !== ""
    ) {
      return { ok: true, value: body[paramName as keyof typeof body] as string };
    }
    return { ok: false, status: 400, message: `${paramName} 参数不能为空` };
  }

  return {
    ok: false,
    status: 405,
    message: `不支持的请求方法: ${c.req.method}`,
  };
}
