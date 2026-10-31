/** Shown while Clerk's client bundle boots, so the auth panel is never blank. */
export function AuthLoading() {
  return (
    <div className="mx-auto w-full max-w-sm animate-pulse" aria-busy="true" aria-live="polite">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-40 rounded-full bg-espresso/10" />
        <div className="h-4 w-56 rounded-full bg-espresso/[0.07]" />
      </div>
      <div className="space-y-3">
        <div className="h-11 w-full rounded-2xl bg-espresso/[0.07]" />
        <div className="h-11 w-full rounded-2xl bg-espresso/[0.07]" />
        <div className="h-11 w-full rounded-2xl bg-terracotta/20" />
      </div>
      <span className="sr-only">Loading sign in…</span>
    </div>
  );
}
