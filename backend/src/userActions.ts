import { isEmptyBindingElement, PollingWatchKind } from "typescript";
const mariadb = require("mariadb");
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
export interface File {
  code:string;
  visibility:Number;
  upload_date:string;
  size:Number;
  stored_name:string;
  original_name:string;
  mimetype:string;
  user_id:string;
  type:"file";
}

export interface FileGroup {
  code:string;
  name:string;
  file_ids:(string)[];
  files:(File)[];
  create_date:string;
  type:"group";
}

export async function getTotalQuota(user_id:string | null): Promise<Number> {
  let conn;
  try {
    if (user_id === null) {return 1}
    conn = await pool.getConnection();
    let user_result = await conn.query("SELECT * FROM users WHERE id = ?", [user_id]);
    return user_result[0].quota_in_bytes;
  } finally {if (conn) {conn.release();}}
}

export async function getUsedQuota(user_id:string | null) {
  let conn;
  try {
    if (user_id === null) {return 1}
    conn = await pool.getConnection();
    let used_res = await conn.query("SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",[user_id]);
    return used_res[0].total_used;
  } finally {if (conn) {conn.release();}}
}

export async function getAllFiles(user_id:string | null){
  let conn;
  try {
    conn = await pool.getConnection();
    let file_results = await conn.query("SELECT * FROM file_index WHERE user_id=?",[user_id])
    let group_results = await conn.query("SELECT * FROM file_groups WHERE user_id = ?",[user_id])
    // Create a hashmap based on file codes
    let file_hashmap:Record<string,File> = {}
    for (let file of file_results) {
      let file_code:string = file.id;
      file_hashmap[file_code] = {
        code:file.id,
        visibility:file.visibility,
        upload_date:file.date_added,
        size:file.file_size_in_bytes,
        stored_name:file.stored_filename,
        original_name:file.original_name,
        mimetype:file.mime_type,
        user_id:file.user_id,
        type:"file"
      };
    }
    let grouped_list:(string)[] = []
    let return_list:(File | FileGroup)[] = []
    for (let group of group_results) {
      let temp_dict:FileGroup = {
        code:group.id,
        name:group.name,
        file_ids:group.file_ids,
        files:[],
        create_date: group.created_at,
        type:"group"
      }
      for (let file_id of group.file_ids) {
        temp_dict.files.push(file_hashmap[file_id])
        grouped_list.push(file_id)
      }
      return_list.push(temp_dict)
    }
    let res = Object.keys(file_hashmap).filter((e) => !grouped_list.includes(e));
    for (let id of res){
      return_list.push(file_hashmap[id])
    }
    return_list.push()
    return return_list
  } finally {if(conn){conn.release()}} 
}