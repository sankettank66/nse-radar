import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ScannerSkeleton() {
  return (
    <Card className="rounded-xl border border-border shadow-none">
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
          <Skeleton className="size-[6px] rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12 ml-auto" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-4 w-14 ml-auto" />
          <Skeleton className="h-4 w-12 ml-auto" />
          <Skeleton className="h-4 w-16 ml-auto hidden sm:block" />
          <Skeleton className="h-4 w-12 ml-auto hidden md:block" />
          <Skeleton className="h-4 w-14 ml-auto hidden lg:block" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
            <Skeleton className="size-[6px] rounded-full" />
            <Skeleton className={`h-4 ${["w-16", "w-20", "w-14", "w-18", "w-22", "w-12", "w-16", "w-20"][i % 8]}`} />
            <Skeleton className="h-5 w-12 ml-auto" />
            <Skeleton className="h-5 w-20 ml-auto" />
            <Skeleton className="h-4 w-14 ml-auto" />
            <Skeleton className="h-4 w-12 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto hidden sm:block" />
            <Skeleton className="h-4 w-12 ml-auto hidden md:block" />
            <Skeleton className="h-4 w-14 ml-auto hidden lg:block" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
