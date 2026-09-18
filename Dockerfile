# Slim runner: standalone + static + public. deps/builder — полный bookworm (Prisma generate).
FROM mirror.gcr.io/library/node:24-bookworm AS deps

WORKDIR /app

ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# Карты заливает Vercel, не этот образ. Не качаем бинарь sentry-cli с чужого CDN.
ENV SENTRYCLI_SKIP_DOWNLOAD=1
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
# prisma generate / next build читают env на этапе модуля. Runtime URL задаёт compose.
ENV DATABASE_URL=postgresql://nexus:nexus@db:5432/nexus?sslmode=disable
ENV AUTH_SECRET=build-placeholder

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Без NODE_ENV=production: prisma в devDependencies, нужен generate.
RUN pnpm install --frozen-lockfile

FROM deps AS builder

ENV DOCKER=1

COPY . .
# В репо нет `public/`; standalone COPY в runner ждёт каталог.
RUN mkdir -p public

RUN pnpm build

FROM mirror.gcr.io/library/node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

# prisma CLI в runner нет. migrate:deploy — сервис `migrate` (target: deps).
CMD ["node", "server.js"]
