import type { TextStreamPart, ToolSet } from "ai";
import { expect, test } from "vitest";
import { toTextStreamOrFail } from "@/features/ai-assistant/text-stream";

function partsStream(parts: unknown[]) {
  return new ReadableStream<TextStreamPart<ToolSet>>({
    start(controller) {
      for (const part of parts) {
        controller.enqueue(part as TextStreamPart<ToolSet>);
      }
      controller.close();
    },
  });
}

async function readText(stream: ReadableStream<string>) {
  const reader = stream.getReader();
  const chunks: string[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return chunks.join("");
    }
    chunks.push(value);
  }
}

test("toTextStreamOrFail concatenates text-delta parts", async () => {
  const stream = toTextStreamOrFail({
    stream: partsStream([
      { type: "text-delta", text: "one" },
      { type: "text-delta", text: " two" },
    ]),
  });

  await expect(readText(stream)).resolves.toBe("one two");
});

test("toTextStreamOrFail errors the stream on an error part", async () => {
  const stream = toTextStreamOrFail({
    stream: partsStream([{ type: "error", error: new Error("gateway") }]),
  });

  await expect(readText(stream)).rejects.toThrow("gateway");
});

test("toTextStreamOrFail wraps a non-Error error part", async () => {
  const stream = toTextStreamOrFail({
    stream: partsStream([{ type: "error", error: "boom" }]),
  });

  await expect(readText(stream)).rejects.toThrow("AI stream failed");
});
