import { HttpResponse, http } from "msw";

/** Origin jsdom в тестах. Клиент бьёт в `/api/...`, хендлеры — абсолютные URL. */
export const TEST_ORIGIN = "http://localhost:3000";

const ISO = "2026-01-15T12:00:00.000Z";

export const handlers = [
  http.post(
    `${TEST_ORIGIN}/api/boards/:boardId/columns`,
    async ({ params, request }) => {
      const body = (await request.json()) as { title?: string };

      return HttpResponse.json(
        {
          data: {
            id: "column-msw",
            title: body.title ?? "Column",
            position: 0,
            boardId: String(params.boardId),
            createdAt: ISO,
            updatedAt: ISO,
          },
        },
        { status: 201 },
      );
    },
  ),
  http.delete(`${TEST_ORIGIN}/api/columns/:columnId`, ({ params }) => {
    return HttpResponse.json({ data: { id: String(params.columnId) } });
  }),
];
