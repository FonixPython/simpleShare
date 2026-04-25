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

# Compile seed.ts alongside the rest of the build
RUN npx tsc --outDir dist/prisma --rootDir prisma --esModuleInterop true --module commonjs --target es2020 prisma/seed.ts 2>/dev/null || true

RUN npm prune --omit=dev

FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache \
    libpq \
    vips \
    vim

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
