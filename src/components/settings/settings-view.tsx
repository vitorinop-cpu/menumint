"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { KeyRound, Store, UserMinus, UserPlus, UserRound, Users } from "lucide-react";
import type { Membership, Restaurant, SessionUser } from "@/lib/domain";
import { CUISINES, CURRENCIES } from "@/lib/domain";
import { restaurantUpdateSchema } from "@/lib/validation";
import { initials } from "@/lib/utils";
import { addMemberAction, removeMemberAction, updateRestaurantAction } from "@/app/actions/restaurant";
import { updateProfileAction } from "@/app/actions/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard, GlassCardHeader } from "@/components/glass/glass-card";
import { GlassButton } from "@/components/glass/glass-button";
import { Field, GlassInput, GlassSelect, GlassTextarea } from "@/components/glass/glass-input";
import { Badge, PlanLock } from "@/components/glass/primitives";
import { GlassNotification } from "@/components/glass/glass-notification";

type Values = z.input<typeof restaurantUpdateSchema>;

export function SettingsView({
  restaurant,
  user,
  isOwner,
  members,
  memberLimit,
  planName,
}: {
  restaurant: Restaurant;
  user: SessionUser;
  isOwner: boolean;
  members: Membership[];
  memberLimit: number;
  planName: string;
}) {
  const router = useRouter();
  const form = useForm<Values, unknown, z.output<typeof restaurantUpdateSchema>>({
    resolver: zodResolver(restaurantUpdateSchema),
    defaultValues: {
      name: restaurant.name,
      slug: restaurant.slug,
      tagline: restaurant.tagline,
      description: restaurant.description,
      cuisine: restaurant.cuisine,
      address: restaurant.address,
      phone: restaurant.phone,
      website: restaurant.website,
      currency: restaurant.currency,
      logoUrl: restaurant.logoUrl,
      coverUrl: restaurant.coverUrl,
    },
  });
  const { errors, isDirty, isSubmitting } = form.formState;
  const [name, setName] = React.useState(user.fullName);
  const [savingName, setSavingName] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);
  const canInvite = members.length < memberLimit;

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await updateRestaurantAction(restaurant.id, values);
    if (!res.ok) {
      if (res.fieldErrors) for (const [k, v] of Object.entries(res.fieldErrors)) form.setError(k as keyof Values, { message: v });
      toast.error(res.error);
      return;
    }
    form.reset(values);
    toast.success("Restaurant details saved");
    router.refresh();
  });

  const err = (k: keyof Values) => errors[k]?.message as string | undefined;

  return (
    <div className="space-y-5 pb-10">
      <PageHeader eyebrow="Settings" title="Settings" description="Restaurant details, your account and your team." />

      <GlassCard tone="strong">
        <GlassCardHeader title={<span className="flex items-center gap-2"><Store className="size-4 text-terracotta" aria-hidden /> Restaurant profile</span>} description="Shown on your public menu and in search results." />
        {!isOwner && <GlassNotification tone="info" title="Only the owner can edit restaurant details." className="mb-4" />}
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <fieldset disabled={!isOwner} className="grid gap-4 sm:grid-cols-2">
            <Field label="Restaurant name" htmlFor="s-name" error={err("name")}>
              <GlassInput id="s-name" aria-invalid={!!errors.name} {...form.register("name")} />
            </Field>
            <Field label="Menu link" htmlFor="s-slug" error={err("slug")} hint="Changing this breaks old shared links — QR codes keep working.">
              <div className="flex items-center overflow-hidden rounded-[13px] border border-espresso/12 bg-white/85 focus-within:border-terracotta/70">
                <span className="pl-3.5 text-sm text-espresso-400">/m/</span>
                <input id="s-slug" className="h-11 min-w-0 flex-1 bg-transparent pr-3 text-[15px] text-espresso outline-none" aria-invalid={!!errors.slug} {...form.register("slug")} />
              </div>
            </Field>
            <Field label="Tagline" htmlFor="s-tagline" error={err("tagline")} className="sm:col-span-2">
              <GlassInput id="s-tagline" {...form.register("tagline")} />
            </Field>
            <Field label="About" htmlFor="s-desc" error={err("description")} className="sm:col-span-2">
              <GlassTextarea id="s-desc" rows={3} {...form.register("description")} />
            </Field>
            <Field label="Cuisine" htmlFor="s-cuisine">
              <GlassSelect id="s-cuisine" {...form.register("cuisine")}>
                <option value="">Not set</option>
                {CUISINES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </GlassSelect>
            </Field>
            <Field label="Default currency" htmlFor="s-currency">
              <GlassSelect id="s-currency" {...form.register("currency")}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </GlassSelect>
            </Field>
            <Field label="Address" htmlFor="s-address" error={err("address")}>
              <GlassInput id="s-address" {...form.register("address")} />
            </Field>
            <Field label="Phone" htmlFor="s-phone" error={err("phone")}>
              <GlassInput id="s-phone" type="tel" {...form.register("phone")} />
            </Field>
            <Field label="Website" htmlFor="s-website" error={err("website")} className="sm:col-span-2">
              <GlassInput id="s-website" type="url" placeholder="https://" {...form.register("website")} />
            </Field>
          </fieldset>
          {isOwner && (
            <div className="flex justify-end gap-2">
              <GlassButton type="button" variant="ghost" disabled={!isDirty} onClick={() => form.reset()}>
                Discard
              </GlassButton>
              <GlassButton type="submit" loading={isSubmitting} disabled={!isDirty}>
                Save details
              </GlassButton>
            </div>
          )}
        </form>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <GlassCardHeader title={<span className="flex items-center gap-2"><UserRound className="size-4 text-terracotta" aria-hidden /> Your account</span>} description={user.email} />
          <form
            className="flex items-end gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingName(true);
              const res = await updateProfileAction({ fullName: name });
              setSavingName(false);
              if (!res.ok) return toast.error(res.error);
              toast.success("Name updated");
              router.refresh();
            }}
          >
            <Field label="Full name" htmlFor="acc-name" className="flex-1">
              <GlassInput id="acc-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            </Field>
            <GlassButton type="submit" variant="glass" loading={savingName} disabled={name.trim() === user.fullName}>
              Save
            </GlassButton>
          </form>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-espresso/[0.03] px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-espresso">
              <KeyRound className="size-4 text-espresso-400" aria-hidden /> Password
            </span>
            <GlassButton asChild variant="outline" size="sm">
              <Link href="/forgot-password">Reset password</Link>
            </GlassButton>
          </div>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader
            title={<span className="flex items-center gap-2"><Users className="size-4 text-terracotta" aria-hidden /> Team</span>}
            description={`${members.length} of ${memberLimit} seat${memberLimit === 1 ? "" : "s"} on ${planName}`}
            action={memberLimit <= 1 ? <PlanLock plan="Business" /> : undefined}
          />
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 rounded-2xl bg-white/50 px-3 py-2.5">
                <span className="grid size-9 place-items-center rounded-full bg-[linear-gradient(150deg,#D9CCFF,#8570E6)] text-xs font-semibold text-white">{initials(m.fullName || m.email)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-espresso">
                    {m.fullName || m.email} {m.userId === user.id && <span className="text-espresso-500">(you)</span>}
                  </span>
                  <span className="block truncate text-xs text-espresso-500">{m.email}</span>
                </span>
                <Badge tone={m.role === "owner" ? "terracotta" : "neutral"} className="capitalize">
                  {m.role}
                </Badge>
                {isOwner && m.userId !== restaurant.ownerId && (
                  <GlassButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${m.email}`}
                    onClick={async () => {
                      if (!window.confirm(`Remove ${m.email} from ${restaurant.name}?`)) return;
                      const res = await removeMemberAction(restaurant.id, m.userId);
                      if (!res.ok) return toast.error(res.error);
                      toast.success("Member removed");
                      router.refresh();
                    }}
                  >
                    <UserMinus />
                  </GlassButton>
                )}
              </li>
            ))}
          </ul>
          {isOwner && (
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={async (e) => {
                e.preventDefault();
                const formEl = e.currentTarget;
                const email = String(new FormData(formEl).get("email") ?? "");
                setInviting(true);
                const res = await addMemberAction(restaurant.id, { email, role: "editor" });
                setInviting(false);
                if (!res.ok) return toast.error(res.error);
                formEl.reset();
                toast.success("Team member added as editor");
                router.refresh();
              }}
            >
              <label htmlFor="invite-email" className="sr-only">
                Teammate email
              </label>
              <GlassInput id="invite-email" name="email" type="email" required placeholder="teammate@restaurant.com" disabled={!canInvite} className="flex-1" />
              <GlassButton type="submit" variant="dark" loading={inviting} disabled={!canInvite}>
                <UserPlus /> Add editor
              </GlassButton>
            </form>
          )}
          {!canInvite && (
            <p className="mt-2 text-[13px] text-espresso-500">
              {memberLimit <= 1 ? (
                <>
                  Team members are part of the{" "}
                  <Link href="/dashboard/billing" className="font-semibold text-terracotta-ink underline">
                    Business plan
                  </Link>
                  .
                </>
              ) : (
                "All seats are in use."
              )}
            </p>
          )}
          <p className="mt-3 text-[12px] text-espresso-500">Editors can manage menus, QR codes and branding. Only owners change restaurant details, team and billing.</p>
        </GlassCard>
      </div>
    </div>
  );
}
