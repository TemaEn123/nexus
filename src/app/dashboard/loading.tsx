import { DashboardPageSkeleton } from "./_ui/dashboard-skeletons";

/**
 * Next оборачивает `page.tsx` в Suspense. Layout (header) не входит:
 * при навигации chrome остаётся, скелетон — только контент страницы.
 */
export default function DashboardLoading() {
  return <DashboardPageSkeleton />;
}
