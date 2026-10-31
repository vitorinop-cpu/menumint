"use client";

import * as React from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function GlassModal({ open, onOpenChange, title, description, children, footer, size = "md", className }: GlassModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-espresso/25 backdrop-blur-[6px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
              <Dialog.Content asChild forceMount aria-describedby={description ? undefined : undefined}>
                <motion.div
                  className={cn(
                    "glass-strong pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]",
                    sizes[size],
                    className,
                  )}
                  initial={{ opacity: 0, y: 28, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.9 }}
                >
                  <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
                    <div>
                      <Dialog.Title className="font-display text-[22px] font-medium tracking-[-0.02em] text-espresso">
                        {title}
                      </Dialog.Title>
                      {description ? (
                        <Dialog.Description className="mt-1 text-sm text-espresso-500">{description}</Dialog.Description>
                      ) : (
                        <Dialog.Description className="sr-only">Dialog</Dialog.Description>
                      )}
                    </div>
                    <Dialog.Close
                      className="-mr-2 -mt-1 grid size-9 place-items-center rounded-full text-espresso-500 transition hover:bg-espresso/[0.06] hover:text-espresso"
                      aria-label="Close"
                    >
                      <X className="size-[18px]" />
                    </Dialog.Close>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2">{children}</div>
                  {footer && (
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-espresso/[0.06] bg-white/40 px-6 py-4">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
