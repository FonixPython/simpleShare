import { isEmptyBindingElement, PollingWatchKind } from "typescript";
import { prisma } from "./db";
import * as auth from "./auth";
import bcrypt from "bcrypt"
import "dotenv/config";

// Either returns 0:success and 1:already exists 2:other error
export async function registerUser(new_username:string,new_password:string,is_admin:boolean=false,quota:Number=52428800):Promise<Number>{
    try {
        let password_hash:string = await bcrypt.hash(new_password,10)
        let verification_result = await auth.checkUser(new_username)
        if (verification_result){return 1}
        await prisma.users.create({
            data: {
                username: new_username,
                password_hash: password_hash,
                is_admin: is_admin,
                quota_in_bytes: BigInt(Number(quota))
            }
        });
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
        let user_result = await prisma.users.findUnique({
            where: { id: user_id }
        });
        if (!user_result){return 1}
        
        let new_password_hash:string = await bcrypt.hash(new_password, 10);
        await prisma.users.update({
            where: { id: user_id },
            data: { password_hash: new_password_hash }
        });
        await prisma.session_tokens.deleteMany({
            where: { user_id: user_id }
        });
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}

// Returns 0:success, 1:user not found, 2:username already exists, 3:server error
export async function changeUsername(user_id:string, new_username:string):Promise<Number>{
    try {
        let user_result = await prisma.users.findUnique({
            where: { id: user_id }
        });
        if (!user_result){return 1}
        
        let username_check = await auth.checkUser(new_username);
        if (username_check){return 2}
        
        await prisma.users.update({
            where: { id: user_id },
            data: { username: new_username }
        });
        return 0
    } catch(err){
        console.log(err);
        return 3
    }
}

// Returns 0:success, 1:user not found, 2:server error
export async function changeUserQuota(user_id:string, new_quota:Number):Promise<Number>{
    try {
        let user_result = await prisma.users.findUnique({
            where: { id: user_id }
        });
        if (!user_result){return 1}
        
        await prisma.users.update({
            where: { id: user_id },
            data: { quota_in_bytes: BigInt(Number(new_quota)) }
        });
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}

// Returns 0:success, 1:user not found, 2:server error
export async function changeUserAdminStatus(user_id:string, is_admin:boolean):Promise<Number>{
    try {
        let user_result = await prisma.users.findUnique({
            where: { id: user_id }
        });
        if (!user_result){return 1}
        
        await prisma.users.update({
            where: { id: user_id },
            data: { is_admin: is_admin }
        });
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}

// Returns 0:success, 1:user not found, 2:server error
export async function deleteUser(user_id:string):Promise<Number>{
    try {
        let user_result = await prisma.users.findUnique({
            where: { id: user_id }
        });
        if (!user_result){return 1}
        
        // Delete user's files from database
        await prisma.file_index.deleteMany({
            where: { user_id: user_id }
        });
        await prisma.file_groups.deleteMany({
            where: { user_id: user_id }
        });
        
        // Delete user's session tokens
        await prisma.session_tokens.deleteMany({
            where: { user_id: user_id }
        });
        
        // Delete the user
        await prisma.users.delete({
            where: { id: user_id }
        });
        
        return 0
    } catch(err){
        console.log(err);
        return 2
    }
}

export async function getTotalUsers():Promise<number | null> {
    try {
        const result = await prisma.users.count();
        return result;
    } catch(err){console.log(err);return null}
}

export async function updateGlobalStorageLimit(newLimit:number):Promise<number> {
    try {
        // First check if the setting already exists
        const existing = await prisma.settings.findUnique({
            where: { name: "global-storage-limit" }
        });
        
        if (existing) {
            // Update existing setting
            await prisma.settings.update({
                where: { name: "global-storage-limit" },
                data: {
                    num_value: BigInt(newLimit),
                    comment: "Global storage limit in bytes"
                }
            });
        } else {
            // Insert new setting
            await prisma.settings.create({
                data: {
                    name: "global-storage-limit",
                    num_value: BigInt(newLimit),
                    comment: "Global storage limit in bytes"
                }
            });
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
        const users = await prisma.users.findMany({
            orderBy: { username: 'asc' }
        });
        
        // Then get files for each user
        const usersWithFiles = await Promise.all(
            users.map(async (user: any) => {
                const files = await prisma.file_index.findMany({
                    where: { user_id: user.id },
                    orderBy: { date_added: 'desc' }
                });
                
                return {
                    user_id: user.id,
                    username: user.username,
                    is_admin: user.is_admin,
                    quota: Number(user.quota_in_bytes),
                    creation_date: user.date_of_creation,
                    files: files.map((file: any) => ({
                        id: file.id,
                        code: file.id,
                        originalname: file.original_name,
                        size: Number(file.file_size_in_bytes),
                        date: file.date_added
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
        // Get all files with user info
        const files = await prisma.file_index.findMany({
            orderBy: { date_added: 'desc' }
        });

        const formattedFiles = await Promise.all(files.map(async (file: any) => {
            const user = await prisma.users.findUnique({
                where: { id: file.user_id },
                select: { username: true }
            });
            return {
                code: file.id,
                name: file.original_name,
                size: Number(file.file_size_in_bytes),
                date: file.date_added,
                username: user?.username || 'unknown',
                type: 'file'
            };
        }));

        // Get all groups with user info
        const groups = await prisma.file_groups.findMany({
            orderBy: { created_at: 'desc' }
        });

        const formattedGroups = await Promise.all(groups.map(async (group: any) => {
            const user = await prisma.users.findUnique({
                where: { id: group.user_id },
                select: { username: true }
            });
            const fileIds = JSON.parse(group.file_ids);
            
            // Calculate actual group size by summing file sizes
            let groupSize = 0;
            if (fileIds.length > 0) {
                const groupFiles = await prisma.file_index.findMany({
                    where: { id: { in: fileIds } },
                    select: { file_size_in_bytes: true }
                });
                groupSize = groupFiles.reduce((total, file) => total + Number(file.file_size_in_bytes), 0);
            }
            
            return {
                code: group.id,
                name: group.name,
                size: groupSize,
                date: group.created_at,
                username: user?.username || 'unknown',
                type: 'group',
                fileIds: fileIds,
                fileCount: fileIds.length
            };
        }));

        // Filter out empty groups (groups with 0 files)
        const nonEmptyGroups = formattedGroups.filter(group => group.fileCount > 0);

        // Get all file IDs that are in groups to filter them out from individual files
        const fileIdsInGroups = new Set();
        nonEmptyGroups.forEach(group => {
            group.fileIds.forEach((fileId: string) => fileIdsInGroups.add(fileId));
        });

        // Filter out individual files that are already in groups
        const individualFiles = formattedFiles.filter(file => !fileIdsInGroups.has(file.code));

        // Combine individual files and groups, then sort by date
        return [...individualFiles, ...nonEmptyGroups].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    } catch(err){
        console.log(err);
        return null;
    }
}

export async function getGroupDetails(groupCode: string):Promise<any | null> {
    try {
        const group = await prisma.file_groups.findUnique({
            where: { id: groupCode }
        });

        if (!group) {
            return null;
        }

        const user = await prisma.users.findUnique({
            where: { id: group.user_id },
            select: { username: true }
        });

        const fileIds = JSON.parse(group.file_ids)

        // Get file details
        const files = fileIds.length > 0 ? await prisma.file_index.findMany({
            where: { id: { in: fileIds } },
            orderBy: { date_added: 'desc' }
        }) : [];

        const filesWithUser = await Promise.all(files.map(async (file: any) => {
            const fileUser = await prisma.users.findUnique({
                where: { id: file.user_id },
                select: { username: true }
            });
            return {
                code: file.id,
                name: file.original_name,
                size: Number(file.file_size_in_bytes),
                date: file.date_added,
                username: fileUser?.username || 'unknown',
                type: 'file',
                mime_type: file.mime_type,
                stored_filename: file.stored_filename
            };
        }));

        return {
            code: group.id,
            name: group.name,
            date: group.created_at,
            username: user?.username || 'unknown',
            type: 'group',
            fileIds: fileIds,
            files: filesWithUser,
            fileCount: fileIds.length
        };
    } catch(err) {
        console.log(err);
        return null;
    }
}

// Simplified statistics functions
export async function getUserStatistics():Promise<any | null> {
    try {
        const totalUsers = await prisma.users.count();
        const adminUsers = await prisma.users.count({ where: { is_admin: true } });
        const regularUsers = totalUsers - adminUsers;

        return {
            userTrends: [], // Would need complex date grouping
            adminDistribution: {
                admin_count: adminUsers,
                regular_count: regularUsers
            },
            topUsersByQuota: [] // Would need complex ordering
        };
    } catch(err) {
        console.log(err);
        return null;
    }
}

export async function getFileTypeStatistics():Promise<any | null> {
    try {
        return {
            fileTypeDistribution: [], // Would need complex CASE statements
            uploadTrends: [] // Would need date grouping
        };
    } catch(err) {
        console.log(err);
        return null;
    }
}

export async function getSystemHealthMetrics():Promise<any | null> {
    try {
        const totalUsers = await prisma.users.count();
        const totalFiles = await prisma.file_index.count();
        const totalGroups = await prisma.file_groups.count();

        return {
            quotaUsage: {
                total_users: totalUsers,
                total_allocated_quota: 0, // Would need SUM aggregation
                total_used_storage: 0, // Would need SUM aggregation
                total_files: totalFiles,
                total_groups: totalGroups
            },
            usersOverQuota: [], // Would need complex HAVING clause
            largestFiles: [] // Would need complex ordering
        };
    } catch(err) {
        console.log(err);
        return null;
    }
}

// File management functions
export async function updateFileId(currentId: string, newId: string):Promise<{success: boolean, error?: string}> {
    try {
        // Validate inputs
        if (!currentId || !newId) {
            throw new Error('File ID is required');
        }
        
        if (!/^[a-zA-Z0-9]{6}$/.test(newId)) {
            throw new Error('File ID must be exactly 6 alphanumeric characters');
        }
        
        // Check if current file exists
        const currentFile = await prisma.file_index.findUnique({
            where: { id: currentId }
        });
        if (!currentFile) {
            throw new Error('File not found');
        }
        
        // Check if new ID already exists
        const existingFile = await prisma.file_index.findUnique({
            where: { id: newId }
        });
        if (existingFile) {
            throw new Error('File ID already exists');
        }
        
        // Update database
        await prisma.file_index.update({
            where: { id: currentId },
            data: { id: newId }
        });
        
        // Update file references in groups
        const groupsContainingFile = await prisma.file_groups.findMany({
            where: { file_ids: { contains: currentId } }
        });
        
        for (const group of groupsContainingFile) {
            const fileIds = group.file_ids.split(',').map((id: string) => id.trim());
            const index = fileIds.indexOf(currentId);
            if (index > -1) {
                fileIds[index] = newId;
                await prisma.file_groups.update({
                    where: { id: group.id },
                    data: { file_ids: fileIds.join(',') }
                });
            }
        }
        
        return { success: true };
    } catch(err) {
        console.log(err);
        return { success: false, error: (err as Error).message };
    }
}

export async function updateFileName(fileId: string, newName: string):Promise<{success: boolean, error?: string}> {
    try {
        // Validate inputs
        if (!fileId || !newName) {
            throw new Error('File ID and name are required');
        }
        
        // Check if file exists
        const file = await prisma.file_index.findUnique({
            where: { id: fileId }
        });
        if (!file) {
            throw new Error('File not found');
        }
        
        // Update database
        await prisma.file_index.update({
            where: { id: fileId },
            data: { original_name: newName }
        });
        
        return { success: true };
    } catch(err) {
        console.log(err);
        return { success: false, error: (err as Error).message };
    }
}
