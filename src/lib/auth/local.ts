import "server-only";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { mutate, readDb } from "@/lib/data/local/store";
import { hashPassword } from "@/lib/data/local/seed";
import type { SessionUser } from "@/lib/domain";
import type { AuthAdapter } from "./types";

export const SESSION_COOKIE = "mm_session";
const SESSION_DAYS = 30;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await mutate((db) => {
    const nowIso = new Date().toISOString();
    db.sessions = db.sessions.filter((s) => s.expiresAt > nowIso);
    db.sessions.push({ tokenHash: sha256(token), userId, expiresAt: expiresAt.toISOString() });
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export const localAuth: AuthAdapter = {
  async getUser(): Promise<SessionUser | null> {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const db = await readDb();
    const s = db.sessions.find((x) => x.tokenHash === sha256(token));
    if (!s || s.expiresAt < new Date().toISOString()) return null;
    const p = db.profiles.find((x) => x.id === s.userId);
    return p ? { id: p.id, email: p.email, fullName: p.fullName } : null;
  },

  async signUp({ email, password, fullName }) {
    const created = await mutate((db) => {
      if (db.users.some((u) => u.email === email)) return null;
      const id = randomUUID();
      const ts = new Date().toISOString();
      db.users.push({ id, email, passwordHash: hashPassword(password), createdAt: ts });
      db.profiles.push({ id, email, fullName, onboarding: null, createdAt: ts });
      db.subscriptions.push({
        userId: id,
        plan: "free",
        status: "none",
        source: "default",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        updatedAt: ts,
      });
      return id;
    });
    if (!created) return { ok: false, error: "An account with this email already exists." };
    await startSession(created);
    return { ok: true, needsConfirmation: false };
  },

  async signIn({ email, password }) {
    const db = await readDb();
    const user = db.users.find((u) => u.email === email);
    // Always run a hash to keep timing similar for unknown emails.
    const ok = user ? verifyPassword(password, user.passwordHash) : (verifyPassword(password, hashPassword("x")), false);
    if (!user || !ok) return { ok: false, error: "Incorrect email or password." };
    await startSession(user.id);
    return { ok: true };
  },

  async signOut() {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) {
      const hash = sha256(token);
      await mutate((db) => {
        db.sessions = db.sessions.filter((s) => s.tokenHash !== hash);
      });
    }
    jar.delete(SESSION_COOKIE);
  },

  async requestPasswordReset(email, origin) {
    const token = randomBytes(32).toString("base64url");
    const found = await mutate((db) => {
      const user = db.users.find((u) => u.email === email);
      if (!user) return false;
      db.resetTokens.push({
        tokenHash: sha256(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
        used: false,
      });
      return true;
    });
    // Demo mode has no email delivery: surface the link so the flow can be completed locally.
    return { ok: true, devLink: found ? `${origin}/reset-password?token=${token}` : undefined };
  },

  async updatePassword({ password, token }) {
    if (!token) {
      const user = await localAuth.getUser();
      if (!user) return { ok: false, error: "Your session has expired. Request a new reset link." };
      await mutate((db) => {
        const u = db.users.find((x) => x.id === user.id);
        if (u) u.passwordHash = hashPassword(password);
      });
      return { ok: true };
    }
    const hash = sha256(token);
    const userId = await mutate((db) => {
      const t = db.resetTokens.find((x) => x.tokenHash === hash);
      if (!t || t.used || t.expiresAt < new Date().toISOString()) return null;
      t.used = true;
      const u = db.users.find((x) => x.id === t.userId);
      if (!u) return null;
      u.passwordHash = hashPassword(password);
      db.sessions = db.sessions.filter((s) => s.userId !== u.id);
      return u.id;
    });
    if (!userId) return { ok: false, error: "This reset link is invalid or has expired." };
    await startSession(userId);
    return { ok: true };
  },
};
