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
        // Get groups first to collect all file IDs that belong to groups
        const groupsQuery = await pool.query(`
            SELECT g.id as code, g.name, g.created_at as date, u.username, 'group' as type,
                   g.file_ids
            FROM file_groups g
            JOIN users u ON g.user_id = u.id
            ORDER BY g.created_at DESC
        `);
        
        // Collect all file IDs that are part of groups
        const groupFileIds = new Set<string>();
        const groups = groupsQuery.map((group: any) => {
            let fileIds: string[] = [];
            
            try {
                if (typeof group.file_ids === 'string') {
                    fileIds = JSON.parse(group.file_ids);
                } else if (Array.isArray(group.file_ids)) {
                    fileIds = group.file_ids;
                }
            } catch (e) {
                console.error('Failed to parse file_ids for group:', group.code);
                fileIds = [];
            }
            
            // Add file IDs to the set
            fileIds.forEach(id => groupFileIds.add(id));
            
            return {
                code: group.code,
                name: group.name,
                size: 0, // Will be calculated below
                date: group.date,
                username: group.username,
                type: group.type,
                fileIds: fileIds,
                fileCount: fileIds.length
            };
        });
        
        // Get individual files that are NOT part of any group
        let filesQuery;
        if (groupFileIds.size > 0) {
            filesQuery = await pool.query(`
                SELECT f.id as code, f.original_name as name, f.file_size_in_bytes as size, 
                       f.date_added as date, u.username, 'file' as type
                FROM file_index f
                JOIN users u ON f.user_id = u.id
                WHERE f.id NOT IN (${Array.from(groupFileIds).map(() => '?').join(',')})
                ORDER BY f.date_added DESC
            `, Array.from(groupFileIds));
        } else {
            filesQuery = await pool.query(`
                SELECT f.id as code, f.original_name as name, f.file_size_in_bytes as size, 
                       f.date_added as date, u.username, 'file' as type
                FROM file_index f
                JOIN users u ON f.user_id = u.id
                ORDER BY f.date_added DESC
            `);
        }
        
        const files = filesQuery.map((file: any) => ({
            code: file.code,
            name: file.name,
            size: Number(file.size),
            date: file.date,
            username: file.username,
            type: file.type
        }));
        
        // Calculate group sizes by fetching file information
        for (const group of groups) {
            if (group.fileIds.length > 0) {
                try {
                    const fileSizesQuery = await pool.query(`
                        SELECT SUM(file_size_in_bytes) as total_size
                        FROM file_index 
                        WHERE id IN (${group.fileIds.map(() => '?').join(',')})
                    `, group.fileIds);
                    
                    group.size = Number(fileSizesQuery[0].total_size || 0);
                } catch (e) {
                    console.error('Failed to calculate group size for:', group.code);
                    group.size = 0;
                }
            }
        }
        
        // Combine and sort by date (newest first)
        return [...files, ...groups].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch(err){
        console.log(err);
        return null;
    }
}

export async function getGroupDetails(groupCode: string):Promise<any | null> {
    try {
        // Get group information
        const groupQuery = await pool.query(`
            SELECT g.id as code, g.name, g.created_at as date, u.username, 'group' as type,
                   g.file_ids
            FROM file_groups g
            JOIN users u ON g.user_id = u.id
            WHERE g.id = ?
        `, [groupCode]);
        
        if (groupQuery.length === 0) {
            return null;
        }
        
        const group = groupQuery[0];
        
        // Parse file_ids
        let fileIds: string[] = [];
        try {
            if (typeof group.file_ids === 'string') {
                fileIds = JSON.parse(group.file_ids);
            } else if (Array.isArray(group.file_ids)) {
                fileIds = group.file_ids;
            }
        } catch (e) {
            console.error('Failed to parse file_ids for group:', group.code);
            fileIds = [];
        }
        
        // Get file details for the group
        let files = [];
        if (fileIds.length > 0) {
            const filesQuery = await pool.query(`
                SELECT f.id as code, f.original_name as name, f.file_size_in_bytes as size, 
                       f.date_added as date, f.mime_type, f.stored_filename, u.username
                FROM file_index f
                JOIN users u ON f.user_id = u.id
                WHERE f.id IN (${fileIds.map(() => '?').join(',')})
                ORDER BY f.date_added DESC
            `, fileIds);
            
            files = filesQuery.map((file: any) => ({
                code: file.code,
                name: file.name,
                size: Number(file.size),
                date: file.date,
                username: file.username,
                type: 'file',
                mime_type: file.mime_type,
                stored_filename: file.stored_filename
            }));
        }
        
        return {
            code: group.code,
            name: group.name,
            date: group.date,
            username: group.username,
            type: group.type,
            fileIds: fileIds,
            files: files,
            fileCount: files.length
        };
    } catch(err) {
        console.log(err);
        return null;
    }
}

export async function getUserStatistics():Promise<any | null> {
    try {
        // Get user registration trends (last 12 months)
        const userTrendsQuery = await pool.query(`
            SELECT 
                DATE_FORMAT(date_of_creation, '%Y-%m') as month,
                COUNT(*) as new_users
            FROM users 
            WHERE date_of_creation >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(date_of_creation, '%Y-%m')
            ORDER BY month
        `);
        
        // Get admin vs regular user distribution
        const adminDistributionQuery = await pool.query(`
            SELECT 
                SUM(CASE WHEN is_admin = 1 THEN 1 ELSE 0 END) as admin_count,
                SUM(CASE WHEN is_admin = 0 THEN 1 ELSE 0 END) as regular_count
            FROM users
        `);
        
        // Get user quota distribution
        const quotaDistributionQuery = await pool.query(`
            SELECT 
                username,
                quota_in_bytes,
                (SELECT COALESCE(SUM(file_size_in_bytes), 0) 
                 FROM file_index WHERE user_id = users.id) as used_storage
            FROM users 
            ORDER BY quota_in_bytes DESC
            LIMIT 10
        `);
        
        return {
            userTrends: userTrendsQuery,
            adminDistribution: adminDistributionQuery[0],
            topUsersByQuota: quotaDistributionQuery
        };
    } catch(err) {
        console.log(err);
        return null;
    }
}

export async function getFileTypeStatistics():Promise<any | null> {
    try {
        // Get file type distribution
        const fileTypeQuery = await pool.query(`
            SELECT 
                CASE 
                    WHEN mime_type LIKE 'image/%' THEN 'Images'
                    WHEN mime_type LIKE 'video/%' THEN 'Videos'
                    WHEN mime_type LIKE 'audio/%' THEN 'Audio'
                    WHEN mime_type LIKE 'text/%' THEN 'Text'
                    WHEN mime_type = 'application/pdf' THEN 'PDF'
                    WHEN mime_type LIKE 'application/msword%' OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.wordprocessingml%' THEN 'Documents'
                    WHEN mime_type LIKE 'application/vnd.ms-excel%' OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.spreadsheetml%' THEN 'Spreadsheets'
                    WHEN mime_type LIKE 'application/vnd.ms-powerpoint%' OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.presentationml%' THEN 'Presentations'
                    WHEN mime_type LIKE 'application/zip%' OR mime_type LIKE 'application/x-rar%' OR mime_type LIKE 'application/x-7z%' THEN 'Archives'
                    ELSE 'Other'
                END as file_category,
                COUNT(*) as file_count,
                COALESCE(SUM(file_size_in_bytes), 0) as total_size
            FROM file_index 
            GROUP BY file_category
            ORDER BY file_count DESC
        `);
        
        // Get upload trends (last 30 days)
        const uploadTrendsQuery = await pool.query(`
            SELECT 
                DATE(date_added) as upload_date,
                COUNT(*) as files_uploaded,
                COALESCE(SUM(file_size_in_bytes), 0) as total_size_uploaded
            FROM file_index 
            WHERE date_added >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            GROUP BY DATE(date_added)
            ORDER BY upload_date
        `);
        
        return {
            fileTypeDistribution: fileTypeQuery,
            uploadTrends: uploadTrendsQuery
        };
    } catch(err) {
        console.log(err);
        return null;
    }
}

export async function getSystemHealthMetrics():Promise<any | null> {
    try {
        // Get storage quota usage
        const quotaUsageQuery = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(quota_in_bytes) as total_allocated_quota,
                (SELECT COALESCE(SUM(file_size_in_bytes), 0) FROM file_index) as total_used_storage,
                (SELECT COUNT(*) FROM file_index) as total_files,
                (SELECT COUNT(*) FROM file_groups) as total_groups
            FROM users
        `);
        
        // Get users over quota
        const overQuotaQuery = await pool.query(`
            SELECT 
                u.username,
                u.quota_in_bytes,
                COALESCE(SUM(f.file_size_in_bytes), 0) as used_storage,
                (COALESCE(SUM(f.file_size_in_bytes), 0) / u.quota_in_bytes) * 100 as usage_percentage
            FROM users u
            LEFT JOIN file_index f ON u.id = f.user_id
            GROUP BY u.id, u.username, u.quota_in_bytes
            HAVING usage_percentage > 90
            ORDER BY usage_percentage DESC
        `);
        
        // Get largest files
        const largestFilesQuery = await pool.query(`
            SELECT 
                f.id as code,
                f.original_name as name,
                f.file_size_in_bytes as size,
                f.date_added as date,
                u.username
            FROM file_index f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.file_size_in_bytes DESC
            LIMIT 10
        `);
        
        return {
            quotaUsage: quotaUsageQuery[0],
            usersOverQuota: overQuotaQuery,
            largestFiles: largestFilesQuery
        };
    } catch(err) {
        console.log(err);
        return null;
    }
}

// Database management functions

export async function getDatabaseTables():Promise<string[] | null> {
    try {
        const result = await pool.query("SHOW TABLES");
        const tables = result.map((row: any) => {
            // MySQL returns table names in a property named 'Tables_in_[database_name]'
            const tableName = Object.values(row)[0] as string;
            return tableName;
        });
        return tables;
    } catch(err) {
        console.log(err);
        return null;
    }
}

export async function getTableData(tableName: string):Promise<any[] | null> {
    try {
        // Validate table name to prevent SQL injection
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name');
        }
        
        const result = await pool.query(`SELECT * FROM \`${tableName}\``);
        return result;
    } catch(err) {
        console.log(err);
        return null;
    }
}

export async function getTableSchema(tableName: string):Promise<any[] | null> {
    try {
        // Validate table name to prevent SQL injection
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name');
        }
        
        const result = await pool.query(`DESCRIBE \`${tableName}\``);
        return result;
    } catch(err) {
        console.log(err);
        return null;
    }
}

export async function updateTableCell(tableName: string, rowId: string, columnName: string, newValue: any):Promise<{success: boolean, error?: string}> {
    try {
        // Validate inputs to prevent SQL injection
        if (!/^[a-zA-Z0-9_]+$/.test(tableName) || !/^[a-zA-Z0-9_]+$/.test(columnName)) {
            throw new Error('Invalid table or column name');
        }
        
        // Get table schema to find primary key
        const schema = await getTableSchema(tableName);
        if (!schema) {
            throw new Error('Failed to get table schema');
        }
        
        const primaryKey = schema.find((col: any) => col.Key === 'PRI');
        if (!primaryKey) {
            throw new Error('Table has no primary key');
        }
        
        // Update the cell
        await pool.query(
            `UPDATE \`${tableName}\` SET \`${columnName}\` = ? WHERE \`${primaryKey.Field}\` = ?`,
            [newValue, rowId]
        );
        
        return { success: true };
    } catch(err) {
        console.log(err);
        return { success: false, error: (err as Error).message };
    }
}

export async function insertTableRow(tableName: string, rowData: any):Promise<{success: boolean, error?: string, insertedId?: any}> {
    try {
        // Validate table name to prevent SQL injection
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name');
        }
        
        // Get table schema
        const schema = await getTableSchema(tableName);
        if (!schema) {
            throw new Error('Failed to get table schema');
        }
        
        // Filter valid columns and prepare values
        const columns = schema.filter((col: any) => rowData.hasOwnProperty(col.Field));
        if (columns.length === 0) {
            throw new Error('No valid columns provided');
        }
        
        const columnNames = columns.map(col => col.Field);
        const values = columnNames.map(col => rowData[col]);
        const placeholders = columnNames.map(() => '?');
        
        // Insert the row
        const result = await pool.query(
            `INSERT INTO \`${tableName}\` (\`${columnNames.join('`, `')}\`) VALUES (${placeholders.join(', ')})`,
            values
        );
        
        return { 
            success: true, 
            insertedId: result.insertId 
        };
    } catch(err) {
        console.log(err);
        return { success: false, error: (err as Error).message };
    }
}

export async function deleteTableRow(tableName: string, rowId: string):Promise<{success: boolean, error?: string}> {
    try {
        // Validate table name to prevent SQL injection
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name');
        }
        
        // Get table schema to find primary key
        const schema = await getTableSchema(tableName);
        if (!schema) {
            throw new Error('Failed to get table schema');
        }
        
        const primaryKey = schema.find((col: any) => col.Key === 'PRI');
        if (!primaryKey) {
            throw new Error('Table has no primary key');
        }
        
        // Delete the row
        await pool.query(
            `DELETE FROM \`${tableName}\` WHERE \`${primaryKey.Field}\` = ?`,
            [rowId]
        );
        
        return { success: true };
    } catch(err) {
        console.log(err);
        return { success: false, error: (err as Error).message };
    }
}