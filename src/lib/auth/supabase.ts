import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthAdapter } from "./types";

export const supabaseAuth: AuthAdapter = {
  async getUser() {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      fullName: (profile?.full_name as string | undefined) ?? (data.user.user_metadata?.full_name as string) ?? "",
    };
  },

  async signUp({ email, password, fullName }) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback?next=/onboarding`,
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, needsConfirmation: !data.session };
  },

  async signIn({ email, password }) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: "Incorrect email or password." };
    return { ok: true };
  },

  async signOut() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  },

  async requestPasswordReset(email, origin) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    // Do not reveal whether the account exists.
    if (error && error.status !== 400) return { ok: false, error: "Could not send reset email. Try again shortly." };
    return { ok: true };
  },

  async updatePassword({ password }) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },
};
