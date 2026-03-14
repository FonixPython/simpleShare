import { isEmptyBindingElement, PollingWatchKind } from "typescript";
const pool = require("./db");
import * as auth from "./auth";
const bcrypt = require("bcrypt")
require("dotenv").config();

// Either returns 0:success and 1:already exists 2:other error
export async function registerUser(new_username:string,new_password:string,is_admin:boolean=false,quota:Number=52428800):Promise<Number>{
    try {
        let password_hash:string = await bcrypt.hash(new_password,10)
        let verification_result = await auth.checkUser(new_username)
        if (verification_result){return 1}
        await pool.query("INSERT INTO users (username, password_hash, is_admin, quota_in_bytes) VALUES (?, ?, ?, ?)",[new_username, password_hash, is_admin ? 1 : 0, quota]);
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}

// Admin functions for user management

// Returns 0:success, 1:user not found, 2:server error
export async function changeUserPassword(user_id:string, new_password:string):Promise<Number>{
    try {
        let user_result = await pool.query("SELECT * FROM users WHERE id=?", [user_id]);
        if (user_result.length === 0){return 1}
        
        let new_password_hash:string = await bcrypt.hash(new_password, 10);
        await pool.query("UPDATE users SET password_hash =? WHERE id = ?",[new_password_hash, user_id]);
        await pool.query("DELETE FROM session_tokens WHERE user_id = ?",[user_id]);
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}

// Returns 0:success, 1:user not found, 2:username already exists, 3:server error
export async function changeUsername(user_id:string, new_username:string):Promise<Number>{
    try {
        let user_result = await pool.query("SELECT * FROM users WHERE id=?", [user_id]);
        if (user_result.length === 0){return 1}
        
        let username_check = await auth.checkUser(new_username);
        if (username_check){return 2}
        
        await pool.query("UPDATE users SET username =? WHERE id = ?",[new_username, user_id]);
        return 0
    } catch(err){
        console.log(err);
        return 3
    }
}

// Returns 0:success, 1:user not found, 2:server error
export async function changeUserQuota(user_id:string, new_quota:Number):Promise<Number>{
    try {
        let user_result = await pool.query("SELECT * FROM users WHERE id=?", [user_id]);
        if (user_result.length === 0){return 1}
        
        await pool.query("UPDATE users SET quota_in_bytes =? WHERE id = ?",[new_quota, user_id]);
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}

// Returns 0:success, 1:user not found, 2:server error
export async function changeUserAdminStatus(user_id:string, is_admin:boolean):Promise<Number>{
    try {
        let user_result = await pool.query("SELECT * FROM users WHERE id=?", [user_id]);
        if (user_result.length === 0){return 1}
        
        await pool.query("UPDATE users SET is_admin =? WHERE id = ?",[is_admin ? 1 : 0, user_id]);
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}

// Returns 0:success, 1:user not found, 2:server error
export async function deleteUser(user_id:string):Promise<Number>{
    try {
        let user_result = await pool.query("SELECT * FROM users WHERE id=?", [user_id]);
        if (user_result.length === 0){return 1}
        
        // Delete user's files from database
        await pool.query("DELETE FROM file_index WHERE user_id = ?", [user_id]);
        await pool.query("DELETE FROM file_groups WHERE user_id = ?", [user_id]);
        
        // Delete user's session tokens
        await pool.query("DELETE FROM session_tokens WHERE user_id = ?", [user_id]);
        
        // Delete the user
        await pool.query("DELETE FROM users WHERE id = ?", [user_id]);
        
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}

export async function getTotalUsers():Promise<number | null> {
    try {
        const result = await pool.query("SELECT COUNT(*) AS total_users FROM users");
        return Number(result[0].total_users || 0);
    } catch(err){console.log(err);return null}
}

export async function updateGlobalStorageLimit(newLimit:number):Promise<number> {
    try {
        // First check if the setting already exists
        const existing = await pool.query("SELECT * FROM settings WHERE name = ?", ["global-storage-limit"]);
        
        if (existing.length > 0) {
            // Update existing setting
            await pool.query("UPDATE settings SET num_value = ?, comment = ? WHERE name = ?", 
                [newLimit, "Global storage limit in bytes", "global-storage-limit"]);
        } else {
            // Insert new setting
            await pool.query("INSERT INTO settings (name, num_value, comment) VALUES (?, ?, ?)", 
                ["global-storage-limit", newLimit, "Global storage limit in bytes"]);
        }
        
        return 0;
    } catch(err){
        console.log(err);
        return 1;
    }
}

export async function getAllUsersWithFiles():Promise<any[] | null> {
    try {
        // First get all users
        const usersQuery = await pool.query(`
            SELECT id as user_id, username, is_admin, quota_in_bytes as quota, date_of_creation as creation_date
            FROM users
            ORDER BY username
        `);
        
        // Then get files for each user
        const usersWithFiles = await Promise.all(
            usersQuery.map(async (user: any) => {
                const filesQuery = await pool.query(`
                    SELECT id as file_id, id as code, original_name as originalname, 
                           file_size_in_bytes as size, date_added as file_date
                    FROM file_index 
                    WHERE user_id = ?
                    ORDER BY date_added DESC
                `, [user.user_id]);
                
                return {
                    user_id: user.user_id,
                    username: user.username,
                    is_admin: Boolean(user.is_admin),
                    quota: Number(user.quota),
                    creation_date: user.creation_date,
                    files: filesQuery.map((file: any) => ({
                        id: file.file_id,
                        code: file.code,
                        originalname: file.originalname,
                        size: Number(file.size),
                        date: file.file_date
                    }))
                };
            })
        );
        
        return usersWithFiles;
    } catch(err){
        console.log(err);
        return null;
    }
}

export async function getAllFiles():Promise<any[] | null> {
    try {
        const filesQuery = await pool.query(`
            SELECT f.id as code, f.original_name as name, f.file_size_in_bytes as size, 
                   f.date_added as date, u.username
            FROM file_index f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.date_added DESC
        `);
        
        return filesQuery.map((file: any) => ({
            code: file.code,
            name: file.name,
            size: Number(file.size),
            date: file.date,
            username: file.username
        }));
    } catch(err){
        console.log(err);
        return null;
    }
}