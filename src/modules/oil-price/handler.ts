import {
  ensureDataLoaded,
  findPriceByRegionItem,
  findRegionByQuery,
  getSnapshot,
  normalizeRegionQuery,
} from "./data-store.js";
import { config } from "../../config.js";
import { extractRequestParam } from "../../common.js";
import type { Context } from "hono";

type OilPriceStatus = 200 | 400 | 404;
const PRODUCT_NAME_MAP: Record<string, string> = {
  "0": "0#柴油",
  "89": "89#汽油",
  "92": "92#汽油",
  "95": "95#汽油",
};

async function handleQueryByText(query: string): Promise<{
  status: OilPriceStatus;
  body: Record<string, unknown>;
}> {
  await ensureDataLoaded();

  const normalizedQuery = normalizeRegionQuery(query);
  if (!normalizedQuery) {
    return {
      status: 400,
      body: {
        code: 400,
        message: "query 参数不能为空",
        data: null,
      },
    };
  }

  const region = findRegionByQuery(query);
  if (!region) {
    return {
      status: 404,
      body: {
        code: 404,
        message: "未匹配到地区",
        data: {
          normalized_query: normalizedQuery,
        },
      },
    };
  }

  const match = findPriceByRegionItem(region);
  if (!match) {
    return {
      status: 404,
      body: {
        code: 404,
        message: "未匹配到油价数据",
        data: {
          region: region.region,
          province_code: region.province_code,
          zone_code: region.zone_code,
        },
      },
    };
  }

  const snapshot = getSnapshot();
  const formattedItems = Object.entries(match.zone.items).map(([code, price]) => ({
    code,
    name: PRODUCT_NAME_MAP[code] ?? `${code}#`,
    price: String(price),
  }));

  return {
    status: 200,
    body: {
      code: 200,
      message: config.resultMessage,
      data: {
        region: region.region,
        province_code: region.province_code,
        zone_code: region.zone_code,
        province_name: match.province.province_name,
        zone_name: match.zone.zone_name,
        items: formattedItems,
        unit: snapshot.priceData.unit,
        currency: snapshot.priceData.currency,
        adjustment_date: snapshot.priceData.adjustment_date,
        effective_from: snapshot.priceData.effective_from,
        missing_products: match.zone.missing_products,
        latest_updated_at: snapshot.latestUpdatedAt ?? null,
      },
    },
  };
}

export async function handleQuery(c: Context) {
  const extracted = await extractRequestParam(c, "query");
  if (!extracted.ok) {
    return c.json(
      {
        code: extracted.status,
        message: extracted.message,
        data: null,
      },
      extracted.status as 400 | 405
    );
  }
  const query = extracted.value;
  const result = await handleQueryByText(query);
  return c.json(result.body, result.status);
}
