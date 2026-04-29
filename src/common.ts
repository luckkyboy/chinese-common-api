import { config } from "./config.js";
import { getRuntimeConfig } from "./config.js";
import type { Context, Hono } from "hono";

type GithubRawParams = {
  repo: string;
  branch: string;
  path: string;
};

function renderTemplate(template: string, params: GithubRawParams): string {
  return template
    .replaceAll("${repo}", params.repo)
    .replaceAll("${branch}", params.branch)
    .replaceAll("${path}", params.path);
}

export function buildGithubRawUrl(params: GithubRawParams): string {
  const useOverseas = getRuntimeConfig().overseasFlag;
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

export function getDateInUTC8(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const cn = new Date(utc + 8 * 60 * 60 * 1000);
  const y = cn.getUTCFullYear();
  const m = String(cn.getUTCMonth() + 1).padStart(2, "0");
  const d = String(cn.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

export async function extractOptionalRequestParam(
  c: Context,
  paramName: string
): Promise<
  | { ok: true; value: string | undefined }
  | { ok: false; status: number; message: string }
> {
  if (c.req.method === "GET") {
    const value = c.req.query(paramName);
    return {
      ok: true,
      value: typeof value === "string" && value.trim() !== "" ? value : undefined,
    };
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
      typeof body[paramName as keyof typeof body] === "string"
    ) {
      const value = String(body[paramName as keyof typeof body]).trim();
      return { ok: true, value: value !== "" ? value : undefined };
    }
    return { ok: true, value: undefined };
  }

  return {
    ok: false,
    status: 405,
    message: `不支持的请求方法: ${c.req.method}`,
  };
}
