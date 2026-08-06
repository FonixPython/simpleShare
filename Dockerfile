FROM node:24-alpine AS builder

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    libpq-dev \
    vips-dev \
    vim

WORKDIR /app

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma

RUN npm install

COPY backend ./backend
COPY client ./client
COPY set-update-status.js ./

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

RUN npx prisma generate
RUN npm run build
RUN npx tsc -p prisma/tsconfig.json
RUN npm prune --omit=dev

FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache \
    libpq \
    vips \
    vim \
    mariadb-client

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

ENTRYPOINT ["./entrypoint.sh"]
