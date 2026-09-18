import { PageSkeleton } from "@/components/common/page-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-fib5 py-fib7 sm:px-fib6">
      <PageSkeleton rows={4} />
    </div>
  );
}
