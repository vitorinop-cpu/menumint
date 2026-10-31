import type { SessionUser } from "@/lib/domain";

export type AuthResult = { ok: true } | { ok: false; error: string };

export interface AuthAdapter {
  getUser(): Promise<SessionUser | null>;
  signUp(input: { email: string; password: string; fullName: string }): Promise<
    { ok: true; needsConfirmation: boolean } | { ok: false; error: string }
  >;
  signIn(input: { email: string; password: string }): Promise<AuthResult>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string, origin: string): Promise<{ ok: true; devLink?: string } | { ok: false; error: string }>;
  updatePassword(input: { password: string; token?: string | null }): Promise<AuthResult>;
}
