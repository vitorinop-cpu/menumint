import { cn } from "@/lib/utils";

/**
 * Pure-CSS device frame. The screen is a positioned, clipped box with an explicit
 * height so an embedded <MenuView mode="embed"> can fill it and scroll internally.
 */
export function PhoneMockup({
  children,
  className,
  screenClassName,
  float = false,
  label,
  inert,
}: {
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
  float?: boolean;
  label?: string;
  inert?: boolean;
}) {
  return (
    <div className={cn("relative", float && "animate-float", className)}>
      {/* Ground shadow */}
      <div aria-hidden className="absolute inset-x-[12%] -bottom-8 h-16 rounded-[50%] bg-espresso/25 blur-2xl" />
      {/* Side buttons */}
      <span aria-hidden className="absolute -left-[3px] top-[104px] h-7 w-[4px] rounded-l-md bg-[#2b221e]" />
      <span aria-hidden className="absolute -left-[3px] top-[148px] h-12 w-[4px] rounded-l-md bg-[#2b221e]" />
      <span aria-hidden className="absolute -left-[3px] top-[206px] h-12 w-[4px] rounded-l-md bg-[#2b221e]" />
      <span aria-hidden className="absolute -right-[3px] top-[168px] h-[72px] w-[4px] rounded-r-md bg-[#2b221e]" />

      <div
        className={cn(
          "relative rounded-[44px] p-[9px]",
          "bg-[linear-gradient(145deg,#5a4a42_0%,#2b211d_22%,#1a1412_60%,#3c2f29_100%)]",
          "shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),inset_0_1px_1px_rgb(255_255_255/0.25),0_2px_4px_rgb(36_27_24/0.12),0_30px_60px_-20px_rgb(36_27_24/0.45),0_60px_120px_-40px_rgb(120_60_30/0.35)]",
        )}
      >
        <div
          role={label ? "img" : undefined}
          aria-label={label}
          inert={inert}
          className={cn(
            "relative h-[600px] w-[284px] overflow-hidden rounded-[36px] bg-ivory ring-1 ring-black/60 sm:h-[640px] sm:w-[300px]",
            screenClassName,
          )}
        >
          {children}
          {/* Dynamic island */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[9px] z-40 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <span className="absolute right-[14px] top-1/2 size-[9px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#3a3f5c,#0b0b10_70%)]" />
          </div>
          {/* Glass reflection */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-30 rounded-[36px] bg-[linear-gradient(115deg,rgb(255_255_255/0.16)_0%,rgb(255_255_255/0.04)_28%,transparent_42%,transparent_78%,rgb(255_255_255/0.06)_100%)]"
          />
          {/* Home indicator */}
          <div aria-hidden className="pointer-events-none absolute bottom-[7px] left-1/2 z-40 h-[4px] w-[108px] -translate-x-1/2 rounded-full bg-white/75 mix-blend-difference" />
        </div>
      </div>
    </div>
  );
}
