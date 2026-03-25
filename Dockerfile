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

# Dummy DB for npx
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

RUN npx prisma generate
RUN npm run build
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
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/server.js"]

