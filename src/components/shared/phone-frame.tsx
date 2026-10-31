import { cn } from "@/lib/utils";

/** CSS device frame for live previews. Children fill the screen area. */
export function PhoneFrame({
  children,
  className,
  label = "Live preview",
  fitHeight,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
  /** Size by viewport height (for sticky side previews) instead of container width. */
  fitHeight?: boolean;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      className={cn(
        "relative mx-auto aspect-[9/19.2] w-full max-w-[340px] rounded-[48px] bg-[linear-gradient(145deg,#3b302b,#1b1411)] p-[10px] shadow-[0_2px_0_rgb(255_255_255/0.08)_inset,0_30px_60px_-20px_rgb(36_27_24/0.45),0_12px_24px_-12px_rgb(36_27_24/0.3)]",
        fitHeight && "h-[min(700px,calc(100dvh-12rem))] w-auto max-w-full",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-[3px] rounded-[45px] ring-1 ring-white/10" aria-hidden />
      <div className="relative h-full w-full overflow-hidden rounded-[39px] bg-white">
        <div aria-hidden className="absolute left-1/2 top-2.5 z-40 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
        <div className="h-full w-full [transform:translateZ(0)]">{children}</div>
        <div aria-hidden className="pointer-events-none absolute inset-0 z-30 rounded-[39px] bg-[linear-gradient(115deg,rgb(255_255_255/0.12)_0%,transparent_28%)]" />
      </div>
    </div>
  );
}
