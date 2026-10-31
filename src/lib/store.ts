import fs from "fs/promises";
import path from "path";
import { kv as vercelKv } from "@vercel/kv";
import { Redis } from "@upstash/redis";

export type LocationRecord = {
  phone: string;
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
};

export type PhotoRecord = {
  phone: string;
  dataUrl: string;
  timestamp: number;
};

type Store = {
  locations: Record<string, LocationRecord[]>;
  photos: Record<string, PhotoRecord[]>;
};

const HAS_UPSTASH = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const HAS_VERCEL_KV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const USE_DB = HAS_UPSTASH || HAS_VERCEL_KV;

const upstash = HAS_UPSTASH ? Redis.fromEnv() : null;

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "locations.json");
const DB_KEY = "tracking:store";

async function ensureFile() {
  if (USE_DB) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ locations: {}, photos: {} }, null, 2), "utf8");
  }
}

async function readStore(): Promise<Store> {
  if (USE_DB) {
    try {
      let data: Store | null = null;
      if (HAS_UPSTASH && upstash) {
        data = await upstash.get<Store>(DB_KEY);
      } else {
        data = await vercelKv.get<Store>(DB_KEY);
      }
      if (!data) return { locations: {}, photos: {} };
      if (!data.locations) data.locations = {};
      if (!data.photos) data.photos = {};
      return data;
    } catch {
      return { locations: {}, photos: {} };
    }
  }
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.locations) parsed.locations = {};
    if (!parsed.photos) parsed.photos = {};
    return parsed as Store;
  } catch {
    return { locations: {}, photos: {} };
  }
}

async function writeStore(store: Store) {
  if (USE_DB) {
    if (HAS_UPSTASH && upstash) {
      await upstash.set(DB_KEY, store);
    } else {
      await vercelKv.set(DB_KEY, store);
    }
    return;
  }
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function addLocation(record: LocationRecord) {
  const store = await readStore();
  const key = record.phone;
  if (!store.locations[key]) store.locations[key] = [];
  store.locations[key].push({ ...record, phone: key });
  if (store.locations[key].length > 200) {
    store.locations[key] = store.locations[key].slice(-200);
  }
  await writeStore(store);
}

export async function getLatest(phone: string): Promise<LocationRecord | null> {
  const store = await readStore();
  const key = phone;
  const arr = store.locations[key];
  if (!arr || arr.length === 0) return null;
  return arr[arr.length - 1];
}

export async function getHistory(phone: string): Promise<LocationRecord[]> {
  const store = await readStore();
  const key = phone;
  return store.locations[key] ?? [];
}

export async function addPhoto(record: PhotoRecord) {
  const store = await readStore();
  const key = record.phone;
  if (!store.photos[key]) store.photos[key] = [];
  store.photos[key].push({ ...record, phone: key });
  if (store.photos[key].length > 20) {
    store.photos[key] = store.photos[key].slice(-20);
  }
  await writeStore(store);
}

export async function getLatestPhoto(phone: string): Promise<PhotoRecord | null> {
  const store = await readStore();
  const key = phone;
  const arr = store.photos[key];
  if (!arr || arr.length === 0) return null;
  return arr[arr.length - 1];
}

export async function getPhotoHistory(phone: string): Promise<PhotoRecord[]> {
  const store = await readStore();
  const key = phone;
  return store.photos[key] ?? [];
}

export async function listPhones(): Promise<string[]> {
  const store = await readStore();
  return Object.keys(store.locations);
}