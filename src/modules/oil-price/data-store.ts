import regionsPayload from "./regions.json" with { type: "json" };
import { buildGithubRawUrl } from "../../common.js";
import { config } from "../../config.js";

export interface RegionItem {
  region: string;
  province_code: string;
  zone_code: string;
  locality?: string;
}

export interface PriceZone {
  zone_code: string;
  zone_name: string;
  items: Record<string, number>;
  missing_products: string[];
}

export interface PriceProvince {
  province_code: string;
  province_name: string;
  zones: PriceZone[];
}

export interface PricePayload {
  adjustment_date: string;
  effective_from: string;
  unit: string;
  currency: string;
  products: string[];
  provinces: PriceProvince[];
  updated_at?: string;
}

interface RegionsPayload {
  generated_at: string;
  count: number;
  items: RegionItem[];
}

interface LatestPointerPayload {
  latest: string;
  latest_summary?: string;
  adjustment_date?: string;
  updated_at?: string;
}

export interface DataSnapshot {
  latestPath: string;
  latestUrl: string;
  regionsUpdatedAt: string;
  latestUpdatedAt?: string;
  fetchedAt: string;
  nextRefreshAt: string;
  regions: RegionItem[];
  priceData: PricePayload;
}

const PRICE_BASE_URL = buildGithubRawUrl({
  repo: config.oilPrice.repo,
  branch: config.oilPrice.branch,
  path: `${config.oilPrice.dataBasePath}/`,
});
const PRICE_DATA_PREFIX = `${PRICE_BASE_URL}prices/`;
const LATEST_POINTER_URL = buildGithubRawUrl({
  repo: config.oilPrice.repo,
  branch: config.oilPrice.branch,
  path: config.oilPrice.latestPointerPath,
});
let snapshot: DataSnapshot | null = null;
let inFlight: Promise<DataSnapshot> | null = null;
let nextRefreshAtMs = 0;

function getNextChinaMidnightMs(from = new Date()): number {
  const utcMs = from.getTime();
  const chinaOffsetMs = 8 * 60 * 60 * 1000;
  const chinaNowMs = utcMs + chinaOffsetMs;
  const dayMs = 24 * 60 * 60 * 1000;
  const chinaDayStartMs = Math.floor(chinaNowMs / dayMs) * dayMs;
  const nextChinaDayStartMs = chinaDayStartMs + dayMs;
  return nextChinaDayStartMs - chinaOffsetMs;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

async function loadAll(): Promise<DataSnapshot> {
  const latestPointer = await fetchJson<LatestPointerPayload>(LATEST_POINTER_URL);

  if (!latestPointer.latest) {
    throw new Error(`Invalid latest pointer: missing "latest" field from ${LATEST_POINTER_URL}`);
  }

  const latestUrl = `${PRICE_DATA_PREFIX}${latestPointer.latest}`;
  const priceData = await fetchJson<PricePayload>(latestUrl);

  return {
    latestPath: latestPointer.latest,
    latestUrl,
    regionsUpdatedAt: regionsPayload.generated_at,
    latestUpdatedAt: latestPointer.updated_at,
    fetchedAt: new Date().toISOString(),
    nextRefreshAt: new Date(getNextChinaMidnightMs()).toISOString(),
    regions: regionsPayload.items,
    priceData,
  };
}

export function normalizeRegionQuery(query: string): string {
  return query.trim().replace(/[省市区县]+$/u, "");
}

export function findRegionByQuery(query: string): RegionItem | null {
  const normalized = normalizeRegionQuery(query);
  if (!normalized) return null;
  const data = getSnapshot();
  return data.regions.find((item) => item.region.endsWith(normalized)) ?? null;
}

export function findPriceByRegionItem(regionItem: RegionItem): {
  province: PriceProvince;
  zone: PriceZone;
} | null {
  const data = getSnapshot();
  const province = data.priceData.provinces.find(
    (p) => p.province_code === regionItem.province_code
  );
  if (!province) return null;
  const zone = province.zones.find((z) => z.zone_code === regionItem.zone_code);
  if (!zone) return null;
  return { province, zone };
}

export async function ensureDataLoaded(forceRefresh = false): Promise<DataSnapshot> {
  const isExpired = snapshot !== null && Date.now() >= nextRefreshAtMs;
  if (!forceRefresh && !isExpired && snapshot) {
    return snapshot;
  }

  if (!inFlight) {
    inFlight = loadAll()
      .then((data) => {
        snapshot = data;
        nextRefreshAtMs = new Date(data.nextRefreshAt).getTime();
        return data;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}

export function getSnapshot(): DataSnapshot {
  if (!snapshot) {
    throw new Error("Data is not loaded yet");
  }

  return snapshot;
}
