import "server-only";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type {
  Activity,
  AnalyticsEvent,
  Branding,
  Menu,
  MenuContent,
  Profile,
  QrCode,
  Restaurant,
  Role,
  Subscription,
} from "@/lib/domain";
import { buildSeed } from "./seed";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string; // scrypt$salt$hash
  createdAt: string;
}

export interface SessionRecord {
  tokenHash: string;
  userId: string;
  expiresAt: string;
}

export interface ResetTokenRecord {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  used: boolean;
}

export interface CategoryRow {
  id: string;
  menuId: string;
  name: string;
  description: string;
  position: number;
}

export interface ItemRow {
  id: string;
  menuId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  featured: boolean;
  archived: boolean;
  dietary: string[];
  allergens: string[];
  imageUrl: string | null;
  position: number;
}

export type MenuRow = Omit<Menu, "itemCount"> & { publishedContent: MenuContent | null };

export interface LocalDb {
  version: 1;
  users: UserRecord[];
  sessions: SessionRecord[];
  resetTokens: ResetTokenRecord[];
  profiles: Profile[];
  restaurants: Restaurant[];
  memberships: { restaurantId: string; userId: string; role: Role; createdAt: string }[];
  branding: Branding[];
  menus: MenuRow[];
  categories: CategoryRow[];
  items: ItemRow[];
  images: { id: string; restaurantId: string; storagePath: string; url: string; uploadedBy: string; createdAt: string }[];
  qrCodes: QrCode[];
  events: AnalyticsEvent[];
  subscriptions: Subscription[];
  activity: Activity[];
}

export const DATA_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.MENUMINT_DATA_DIR || ".data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface StoreState {
  db: LocalDb | null;
  mtimeMs: number;
  chain: Promise<unknown>;
}

const g = globalThis as unknown as { __menumintStore?: StoreState };
const state: StoreState = (g.__menumintStore ??= { db: null, mtimeMs: 0, chain: Promise.resolve() });

function emptyDb(): LocalDb {
  return {
    version: 1,
    users: [],
    sessions: [],
    resetTokens: [],
    profiles: [],
    restaurants: [],
    memberships: [],
    branding: [],
    menus: [],
    categories: [],
    items: [],
    images: [],
    qrCodes: [],
    events: [],
    subscriptions: [],
    activity: [],
  };
}

async function persist(db: LocalDb) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(db));
  await fsp.rename(tmp, DB_FILE);
  state.mtimeMs = fs.statSync(DB_FILE).mtimeMs;
}

async function load(): Promise<LocalDb> {
  if (!fs.existsSync(DB_FILE)) {
    const db = emptyDb();
    buildSeed(db);
    await persist(db);
    state.db = db;
    return db;
  }
  const { mtimeMs } = fs.statSync(DB_FILE);
  if (state.db && mtimeMs === state.mtimeMs) return state.db;
  const raw = await fsp.readFile(DB_FILE, "utf8");
  state.db = { ...emptyDb(), ...(JSON.parse(raw) as LocalDb) };
  state.mtimeMs = mtimeMs;
  return state.db;
}

/** Read-only snapshot of the database. Do not mutate the returned object. */
export function readDb(): Promise<LocalDb> {
  const next = state.chain.then(load);
  state.chain = next.catch(() => undefined);
  return next;
}

/** Serialised read-modify-write with atomic persistence. */
export function mutate<T>(fn: (db: LocalDb) => T | Promise<T>): Promise<T> {
  const next = state.chain.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  state.chain = next.catch(() => undefined);
  return next;
}

export async function resetLocalDb() {
  const db = emptyDb();
  buildSeed(db);
  await persist(db);
  state.db = db;
}
