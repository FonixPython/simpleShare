import mariadb from "mariadb";
import "dotenv/config";

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    connectionLimit: 12,
    charset: "utf8mb4",
    timezone: "UTC",
});

export default pool;