import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-[13px] border border-espresso/[0.12] bg-white/85 px-3.5 text-[15px] text-espresso placeholder:text-espresso-400 shadow-[inset_0_1px_2px_rgb(36_27_24/0.05),0_1px_0_rgb(255_255_255/0.9)] outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-espresso/20 focus:border-terracotta/70 focus:bg-white focus:shadow-[0_0_0_4px_rgb(233_117_66/0.14),inset_0_1px_2px_rgb(36_27_24/0.04)] aria-[invalid=true]:border-danger/70 aria-[invalid=true]:focus:shadow-[0_0_0_4px_rgb(194_65_45/0.14)] disabled:opacity-60 disabled:cursor-not-allowed";

export const GlassInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function GlassInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />;
  },
);

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function GlassTextarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, "min-h-[88px] resize-y py-2.5 leading-relaxed", className)} {...props} />;
  },
);

export const GlassSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function GlassSelect({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={cn(fieldBase, "h-11 appearance-none pr-10", className)} {...props}>
          {children}
        </select>
        <svg
          aria-hidden
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-espresso-400"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  },
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-espresso-600", className)} {...props} />;
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
      {message}
    </p>
  );
}

export function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-1.5 text-[13px] text-espresso-500", className)}>{children}</p>;
}

/** Label + control + error wiring with accessible ids. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <FieldError id={`${htmlFor}-error`} message={error} /> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}
