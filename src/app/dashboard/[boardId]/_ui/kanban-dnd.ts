import {
  Accessibility,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type defaultPreset,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { isSortable } from "@dnd-kit/react/sortable";
import type { BoardColumn } from "./board-types";

const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, option, label";

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
  );
}

/** Мышь: 8px, touch: задержка, чтобы не конфликтовать со скроллом доски и кликом Delete. */
export const kanbanSensors = [
  PointerSensor.configure({
    activationConstraints(event) {
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        return [
          new PointerActivationConstraints.Delay({ value: 200, tolerance: 10 }),
        ];
      }

      return [new PointerActivationConstraints.Distance({ value: 8 })];
    },
    preventActivation(event) {
      return isInteractiveTarget(event.target);
    },
  }),
  KeyboardSensor.configure({
    preventActivation(event) {
      return isInteractiveTarget(event.target);
    },
  }),
];

function titleFromData(data: Record<string, unknown>): string | undefined {
  const title = data.title;
  return typeof title === "string" && title.length > 0 ? title : undefined;
}

function cardTitle(
  source: { id: string | number; data: Record<string, unknown> },
  columns: BoardColumn[],
) {
  const fromData = titleFromData(source.data);
  if (fromData) {
    return fromData;
  }

  const id = String(source.id);
  for (const column of columns) {
    const card = column.cards.find((item) => item.id === id);
    if (card) {
      return card.title;
    }
  }

  return "card";
}

function columnTitle(
  columnId: string | number | undefined,
  columns: BoardColumn[],
) {
  if (columnId == null) {
    return "column";
  }

  return (
    columns.find((column) => column.id === String(columnId))?.title ?? "column"
  );
}

export function kanbanPlugins(getColumns: () => BoardColumn[]) {
  return (
    defaults: typeof defaultPreset.plugins,
  ): typeof defaultPreset.plugins => [
    ...defaults.filter((plugin) => plugin !== Accessibility),
    Accessibility.configure({
      announcements: {
        dragstart({ operation: { source } }: DragStartEvent) {
          if (!source) {
            return;
          }

          return `Picked up ${cardTitle(source, getColumns())}`;
        },
        dragover({ operation: { source } }: DragOverEvent) {
          if (!isSortable(source) || source.group == null) {
            return;
          }

          const columns = getColumns();
          const title = cardTitle(source, columns);
          const column = columnTitle(source.group, columns);
          const current = columns.find(
            (item) => item.id === String(source.group),
          );
          const count = current?.cards.length ?? 0;
          const position = source.index + 1;

          return `${title} over ${column}, position ${position} of ${count}`;
        },
        dragend({ canceled, operation: { source } }: DragEndEvent) {
          if (!source) {
            return;
          }

          if (canceled) {
            return "Cancelled";
          }

          const columns = getColumns();
          const title = cardTitle(source, columns);
          const group = isSortable(source) ? source.group : undefined;

          return `Dropped ${title} in ${columnTitle(group, columns)}`;
        },
      },
    }),
  ];
}
