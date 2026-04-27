import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'node dist/prisma/seed.js',
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
