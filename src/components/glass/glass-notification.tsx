"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Glass toast host. Use `toast()` from "sonner" anywhere in client code. */
export function GlassToaster() {
  return (
    <Toaster
      position="bottom-right"
      gap={10}
      offset={20}
      icons={{
        success: <CheckCircle2 className="size-[18px] text-mint-ink" />,
        error: <XCircle className="size-[18px] text-danger" />,
        info: <Info className="size-[18px] text-lavender-ink" />,
        warning: <AlertTriangle className="size-[18px] text-terracotta-ink" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "glass-strong flex w-[min(380px,calc(100vw-40px))] items-start gap-3 rounded-2xl px-4 py-3.5 text-sm text-espresso",
          title: "font-semibold leading-snug",
          description: "text-espresso-500 mt-0.5 leading-snug",
          actionButton:
            "ml-auto shrink-0 rounded-lg bg-espresso px-2.5 py-1 text-xs font-semibold text-ivory hover:bg-espresso-800",
          cancelButton: "ml-auto shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-espresso-500",
          icon: "mt-px",
        },
      }}
    />
  );
}

const tones = {
  info: { icon: Info, cls: "border-lavender/40 bg-lavender-soft/60 text-espresso", iconCls: "text-lavender-ink" },
  success: { icon: CheckCircle2, cls: "border-mint/50 bg-mint-soft/70 text-espresso", iconCls: "text-mint-ink" },
  warning: { icon: AlertTriangle, cls: "border-champagne/50 bg-champagne-soft/70 text-espresso", iconCls: "text-terracotta-ink" },
  demo: { icon: Sparkles, cls: "border-peach/60 bg-peach-soft/70 text-espresso", iconCls: "text-terracotta-ink" },
};

/** Inline glass notification banner (persistent, unlike toasts). */
export function GlassNotification({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof tones;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  const Icon = t.icon;
  return (
    <div
      role={tone === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur-md", t.cls, className)}
    >
      <Icon className={cn("mt-0.5 size-[18px] shrink-0", t.iconCls)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{title}</p>
        {children && <div className="mt-0.5 leading-snug text-espresso-600">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
