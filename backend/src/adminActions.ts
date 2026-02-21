import { isEmptyBindingElement, PollingWatchKind } from "typescript";
const mariadb = require("mariadb");
const bcrypt = require("bcrypt")
require("dotenv").config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "simpleShare",
  connectionLimit: 5,
  charset: "utf8mb4",
});

// Either returns 0:success and 1:already exists 2:other error
export async function registerUser(new_username:string,new_password:string,is_admin:boolean=false,quota:Number=52428800):Promise<Number>{
    let conn;
    try {
        conn = await pool.getConnection();
        let password_hash:string = await bcrypt.hash(new_password,10)
        let verification_result = await conn.query("SELECT * FROM users WHERE username=?",[new_username])
        if (verification_result.length !== 0){return 1}
        await conn.query("INSERT INTO users (username, password_hash, is_admin, quota_in_bytes) VALUES (?, ?, ?, ?)",[new_username, password_hash, is_admin ? 1 : 0, quota]);
        return 0
    } catch(err){
        console.log(err);
        return 2
    } finally {
        if (conn){conn.release()}
    }
}