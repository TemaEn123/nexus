# Жирный образ: Next + все node_modules. Slim ~150MB / standalone — М4.2.
FROM mirror.gcr.io/library/node:24-bookworm

WORKDIR /app

ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
# prisma generate / next build читают env на этапе модуля. Runtime URL задаёт compose.
ENV DATABASE_URL=postgresql://nexus:nexus@db:5432/nexus?sslmode=disable
ENV AUTH_SECRET=build-placeholder

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Без NODE_ENV=production: prisma в devDependencies, нужен migrate:deploy.
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "pnpm db:migrate:deploy && pnpm start --hostname 0.0.0.0"]
