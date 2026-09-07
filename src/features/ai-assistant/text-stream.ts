import type { TextStreamPart, ToolSet } from "ai";

/**
 * Как `toTextStream`, но `error`-часть рвёт поток.
 * Иначе Gateway/модель падают после HTTP 200, `useObject` закрывает пустое тело
 * без `error` (смотрит только `response.ok`).
 */
export function toTextStreamOrFail({
  stream,
}: {
  stream: ReadableStream<TextStreamPart<ToolSet>>;
}): ReadableStream<string> {
  return stream.pipeThrough(
    new TransformStream<TextStreamPart<ToolSet>, string>({
      transform(part, controller) {
        if (part.type === "text-delta") {
          controller.enqueue(part.text);
          return;
        }

        if (part.type === "error") {
          controller.error(
            part.error instanceof Error
              ? part.error
              : new Error("AI stream failed"),
          );
        }
      },
    }),
  );
}
