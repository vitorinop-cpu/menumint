import { cn } from "@/lib/utils";

/** Slow-moving warm gradient field. Pure CSS; paused for reduced motion. */
export function Aurora({ className, intensity = "normal" }: { className?: string; intensity?: "soft" | "normal" }) {
  const o = intensity === "soft" ? 0.55 : 0.85;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute -left-[12%] -top-[18%] h-[70%] w-[60%] rounded-full blur-[90px] animate-aurora"
        style={{ background: "radial-gradient(closest-side, #FFC6A6, transparent)", opacity: o }}
      />
      <div
        className="absolute -right-[10%] top-[2%] h-[60%] w-[50%] rounded-full blur-[100px] animate-aurora [animation-delay:-7s]"
        style={{ background: "radial-gradient(closest-side, #D9CCFF, transparent)", opacity: o * 0.9 }}
      />
      <div
        className="absolute bottom-[-20%] left-[28%] h-[55%] w-[50%] rounded-full blur-[110px] animate-aurora [animation-delay:-13s]"
        style={{ background: "radial-gradient(closest-side, #F6DDB4, transparent)", opacity: o }}
      />
      <div
        className="absolute bottom-[5%] right-[8%] h-[30%] w-[26%] rounded-full blur-[80px] animate-aurora [animation-delay:-4s]"
        style={{ background: "radial-gradient(closest-side, #C9F0DB, transparent)", opacity: o * 0.8 }}
      />
    </div>
  );
}
