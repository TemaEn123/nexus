import { BoardPageSkeleton } from "../_ui/dashboard-skeletons";

/**
 * Скелетон только этой страницы. `dashboard/loading.tsx` убран:
 * родительский loading оборачивает и вложенный сегмент — список мигал бы здесь.
 */
export default function BoardLoading() {
  return <BoardPageSkeleton />;
}
