import { Skeleton } from "@/components/glass/primitives";

export default function EditorLoading() {
  return (
    <div aria-busy="true" aria-label="Loading editor">
      <Skeleton className="mb-6 h-10 w-72" />
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[250px_minmax(0,1fr)_360px]">
        <div className="glass space-y-2 rounded-[24px] p-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="glass-strong space-y-3 rounded-[26px] p-5">
          <Skeleton className="h-8 w-48" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[68px] w-full" />
          ))}
        </div>
        <Skeleton className="mx-auto hidden aspect-[9/19.2] w-full max-w-[330px] rounded-[48px] 2xl:block" />
      </div>
    </div>
  );
}
