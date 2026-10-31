"use client";

import * as React from "react";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";

export const GlassDropdown = DropdownMenu.Root;
export const GlassDropdownTrigger = DropdownMenu.Trigger;

export function GlassDropdownContent({
  className,
  align = "end",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "glass-strong z-50 min-w-[220px] origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-2xl p-1.5",
          "data-[state=open]:animate-[dropdown-in_220ms_var(--ease-spring)] data-[state=closed]:animate-[dropdown-out_120ms_ease-in]",
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

export function GlassDropdownItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof DropdownMenu.Item> & { destructive?: boolean }) {
  return (
    <DropdownMenu.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-espresso outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-espresso/[0.06] data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-espresso-500",
        destructive && "text-danger data-[highlighted]:bg-danger/[0.08] [&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function GlassDropdownLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Label>) {
  return (
    <DropdownMenu.Label
      className={cn("px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-espresso-400", className)}
      {...props}
    />
  );
}

export function GlassDropdownSeparator({ className }: { className?: string }) {
  return <DropdownMenu.Separator className={cn("mx-2 my-1.5 h-px bg-espresso/[0.07]", className)} />;
}
