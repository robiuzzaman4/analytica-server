FROM node:20-alpine AS base
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run prisma:generate
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
