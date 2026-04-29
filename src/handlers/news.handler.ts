import type { Context } from "hono";
import { buildGithubRawUrl, extractOptionalRequestParam, getDateInUTC8 } from "../common.js";
import { config } from "../config.js";

type NewsSuccess = {
  code: 200;
  message: string;
  data: {
    requested_date: string;
    resolved_date: string;
    url: string;
    content: unknown;
  };
};

type NewsError = {
  code: number;
  message: string;
  data: null;
};

type DailyNewsCache = {
  date: string;
  payload: {
    url: string;
    content: unknown;
  };
};

let dailyNewsCache: DailyNewsCache | null = null;

function formatDateCN(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function minusDays(dateText: string, days: number): string {
  const [y, m, d] = dateText.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - days);
  return formatDateCN(dt);
}

function normalizeDateInput(input: string): string | null {
  const text = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const [y, m, d] = text.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() + 1 !== m ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return text;
}

function buildNewsUrl(date: string): string {
  const path = config.newsData.path.replace("${date}", date);
  return buildGithubRawUrl({
    repo: config.newsData.repo,
    branch: config.newsData.branch,
    path,
  });
}

async function fetchJsonByDate(date: string): Promise<{ ok: true; url: string; content: unknown } | { ok: false; status: number }> {
  const url = buildNewsUrl(date);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) return { ok: false, status: res.status };
  const content = await res.json();
  return { ok: true, url, content };
}

export async function handleQuery(c: Context) {
  const today = getDateInUTC8();
  const extracted = await extractOptionalRequestParam(c, "query");
  if (!extracted.ok) {
    const body: NewsError = { code: extracted.status, message: extracted.message, data: null };
    return c.json(body, extracted.status as 400 | 405);
  }
  const input = extracted.value;
  const requestedDate = input ? normalizeDateInput(input) : today;

  if (input && !requestedDate) {
    const body: NewsError = { code: 400, message: "query 日期格式错误，请使用 YYYY-MM-DD", data: null };
    return c.json(body, 400);
  }

  const targetDate = requestedDate ?? today;
  const isTodayQuery = targetDate === today;

  if (dailyNewsCache && dailyNewsCache.date !== today) {
    dailyNewsCache = null;
  }

  const cache = isTodayQuery && dailyNewsCache?.date === today ? dailyNewsCache : null;
  if (cache) {
    const body: NewsSuccess = {
      code: 200,
      message: config.resultMessage,
      data: {
        requested_date: targetDate,
        resolved_date: today,
        url: cache.payload.url,
        content: cache.payload.content,
      },
    };
    return c.json(body, 200);
  }

  let firstTry: Awaited<ReturnType<typeof fetchJsonByDate>>;
  try {
    firstTry = await fetchJsonByDate(targetDate);
  } catch (error) {
    const body: NewsError = {
      code: 500,
      message: `新闻数据获取异常（requested_date=${targetDate}）`,
      data: null,
    };
    console.error("[news] fetch first attempt failed", { targetDate, error });
    return c.json(body, 500);
  }
  if (firstTry.ok) {
    if (isTodayQuery) {
      dailyNewsCache = {
        date: today,
        payload: {
          url: firstTry.url,
          content: firstTry.content,
        },
      };
    }
    const body: NewsSuccess = {
      code: 200,
      message: config.resultMessage,
      data: {
        requested_date: targetDate,
        resolved_date: targetDate,
        url: firstTry.url,
        content: firstTry.content,
      },
    };
    return c.json(body, 200);
  }

  const shouldFallback = targetDate === today && firstTry.status === 404;
  if (shouldFallback) {
    const previousDate = minusDays(today, 1);
    let fallbackTry: Awaited<ReturnType<typeof fetchJsonByDate>>;
    try {
      fallbackTry = await fetchJsonByDate(previousDate);
    } catch (error) {
      const body: NewsError = {
        code: 500,
        message: `新闻数据获取异常（requested_date=${targetDate}, fallback_date=${previousDate}）`,
        data: null,
      };
      console.error("[news] fetch fallback attempt failed", {
        targetDate,
        previousDate,
        error,
      });
      return c.json(body, 500);
    }
    if (fallbackTry.ok) {
      const body: NewsSuccess = {
        code: 200,
        message: config.resultMessage,
        data: {
          requested_date: targetDate,
          resolved_date: previousDate,
          url: fallbackTry.url,
          content: fallbackTry.content,
        },
      };
      return c.json(body, 200);
    }
  }

  const body: NewsError = {
    code: firstTry.status,
    message: `新闻数据获取失败，HTTP ${firstTry.status}`,
    data: null,
  };
  return c.json(body, firstTry.status as 400 | 404 | 500);
}
