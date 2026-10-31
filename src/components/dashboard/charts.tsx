"use client";

import { useIsClient } from "@/lib/hooks";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const useMounted = useIsClient;

const fmtDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function GlassTooltipContent({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      {label && <p className="mb-1 font-semibold text-espresso">{/^\d{4}-/.test(label) ? fmtDay(label) : label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-espresso-600">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-espresso">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export function TrafficChart({ data, height = 260 }: { data: { date: string; views: number; scans: number }[]; height?: number }) {
  const mounted = useMounted();
  return (
    <div style={{ height }} role="img" aria-label={`Chart of menu views and QR scans over ${data.length} days`}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="g-views" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E97542" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#E97542" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-scans" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8570E6" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#8570E6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(36,27,24,0.06)" />
            <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: "#6E5D55" }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6E5D55" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={<GlassTooltipContent />} cursor={{ stroke: "rgba(36,27,24,0.15)" }} />
            <Area type="monotone" dataKey="views" name="Menu views" stroke="#E97542" strokeWidth={2.2} fill="url(#g-views)" animationDuration={900} />
            <Area type="monotone" dataKey="scans" name="QR scans" stroke="#8570E6" strokeWidth={2.2} fill="url(#g-scans)" animationDuration={1100} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function HorizontalBars({ data, height = 220, color = "#E97542", label }: { data: { name: string; value: number }[]; height?: number; color?: string; label: string }) {
  const mounted = useMounted();
  return (
    <div style={{ height }} role="img" aria-label={label}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "#5A4A42" }} axisLine={false} tickLine={false} />
            <Tooltip content={<GlassTooltipContent />} cursor={{ fill: "rgba(36,27,24,0.04)" }} />
            <Bar dataKey="value" name="Count" radius={[0, 8, 8, 0]} fill={color} animationDuration={900} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

const DEVICE_COLORS = ["#E97542", "#8570E6", "#5FBF8F", "#E8BA77"];

export function DonutChart({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  const mounted = useMounted();
  return (
    <div className="h-[180px]" role="img" aria-label={label}>
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none" animationDuration={900}>
              {data.map((_, i) => (
                <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<GlassTooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export { DEVICE_COLORS };
