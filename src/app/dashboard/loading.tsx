import { Skeleton } from "@/components/glass/primitives";

export default function DashboardLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <div className="space-y-3 px-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-[22px] p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-9 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="glass rounded-[22px] p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-6 h-[240px] w-full" />
      </div>
    </div>
  );
}
