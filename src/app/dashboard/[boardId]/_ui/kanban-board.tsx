import { CreateColumnForm } from "@/features/board/create-column-form";
import type { BoardColumn } from "./board-types";
import { KanbanColumn } from "./kanban-column";

/**
 * Канбан: колонки из `getBoard` + форма новой колонки справа.
 * Горизонтальный скролл на любой ширине (не стопка). Карточки — overflow-y внутри колонки.
 * Delete — шаг 5; DnD — после unique position.
 */
export function KanbanBoard({
  boardId,
  columns,
}: {
  boardId: string;
  columns: BoardColumn[];
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-nowrap items-stretch gap-4 overflow-x-auto overflow-y-hidden pb-2">
      {columns.map((column) => (
        <KanbanColumn boardId={boardId} column={column} key={column.id} />
      ))}
      <CreateColumnForm boardId={boardId} />
    </div>
  );
}
