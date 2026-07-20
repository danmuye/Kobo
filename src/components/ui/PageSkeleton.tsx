import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  withHeader?: boolean;
  withSidebar?: boolean;
  sections?: number;
}

function PageSkeleton({ withHeader = true, sections = 3 }: PageSkeletonProps) {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-6" role="status" aria-label="Loading page content">
      {withHeader && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      )}
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 shadow-elegant space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function AuthSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="mx-auto h-4 w-32" />
      </div>
    </div>
  );
}

export { PageSkeleton, AuthSkeleton };
