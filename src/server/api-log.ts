import "server-only";

import {
  logger,
  pathFromRequest,
  requestIdFrom,
  withLogContext,
} from "@/server/logger";

type RouteHandler<Context> = (
  request: Request,
  context: Context,
) => Response | Promise<Response>;

function durationSince(startedAt: number) {
  return Math.round(performance.now() - startedAt);
}

export function withApiLog<Context>(
  handler: RouteHandler<Context>,
): RouteHandler<Context> {
  return async function loggedRouteHandler(request, context) {
    const startedAt = performance.now();
    const baseContext = {
      method: request.method,
      path: pathFromRequest(request),
      requestId: requestIdFrom(request),
    };

    return withLogContext(baseContext, async () => {
      try {
        const response = await handler(request, context);

        logger.info("api_request", {
          status: response.status,
          durationMs: durationSince(startedAt),
        });

        return response;
      } catch (error) {
        logger.error("api_request", {
          status: 500,
          durationMs: durationSince(startedAt),
          error,
        });

        throw error;
      }
    });
  };
}
