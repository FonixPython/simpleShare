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

        // Get user registration trends for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const usersByMonth = await prisma.$queryRaw<{ month: string; new_users: bigint }[]>`
            SELECT 
                DATE_FORMAT(date_of_creation, '%Y-%m') as month,
                COUNT(*) as new_users
            FROM users
            WHERE date_of_creation >= ${sixMonthsAgo}
            GROUP BY DATE_FORMAT(date_of_creation, '%Y-%m')
            ORDER BY month ASC
        `;

        // Get top users by storage usage
        const topUsers = await prisma.$queryRaw<{ username: string; quota_in_bytes: bigint; used_storage: bigint }[]>`
            SELECT 
                u.username,
                u.quota_in_bytes,
                COALESCE(SUM(f.file_size_in_bytes), 0) as used_storage
            FROM users u
            LEFT JOIN file_index f ON u.id = f.user_id
            GROUP BY u.id, u.username, u.quota_in_bytes
            ORDER BY used_storage DESC
            LIMIT 10
        `;

        return {
            userTrends: usersByMonth || [],
            adminDistribution: {
                admin_count: Number(adminUsers),
                regular_count: Number(regularUsers)
            },
            topUsersByQuota: (topUsers || []).map((user: any) => ({
                username: user.username,
                quota_in_bytes: Number(user.quota_in_bytes),
                used_storage: Number(user.used_storage)
            }))
        };
    } catch(err) {
        console.log(err);
        return null;
    }
}

export async function getFileTypeStatistics():Promise<any | null> {
    try {
        // Get file type distribution by MIME type category
        const fileTypeDistribution = await prisma.$queryRaw<{ file_category: string; file_count: bigint; total_size: bigint }[]>`
            SELECT 
                CASE 
                    WHEN mime_type LIKE 'image/%' THEN 'Images'
                    WHEN mime_type LIKE 'video/%' THEN 'Videos'
                    WHEN mime_type LIKE 'audio/%' THEN 'Audio'
                    WHEN mime_type LIKE 'application/pdf%' THEN 'PDF Documents'
                    WHEN mime_type LIKE 'application/msword%' 
                        OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.wordprocessingml%' THEN 'Word Documents'
                    WHEN mime_type LIKE 'application/vnd.ms-excel%'
                        OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.spreadsheetml%' THEN 'Excel Files'
                    WHEN mime_type LIKE 'text/%' THEN 'Text Files'
                    WHEN mime_type LIKE 'application/zip%'
                        OR mime_type LIKE 'application/x-rar-compressed%'
                        OR mime_type LIKE 'application/x-7z-compressed%' THEN 'Archives'
                    ELSE 'Other'
                END as file_category,
                COUNT(*) as file_count,
                COALESCE(SUM(file_size_in_bytes), 0) as total_size
            FROM file_index
            GROUP BY file_category
            ORDER BY file_count DESC
        `;

        // Get upload trends for last 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        const uploadTrends = await prisma.$queryRaw<{ upload_date: Date; files_uploaded: bigint; total_size_uploaded: bigint }[]>`
            SELECT 
                DATE(date_added) as upload_date,
                COUNT(*) as files_uploaded,
                COALESCE(SUM(file_size_in_bytes), 0) as total_size_uploaded
            FROM file_index
            WHERE date_added >= ${fourteenDaysAgo}
            GROUP BY DATE(date_added)
            ORDER BY upload_date ASC
        `;

        return {
            fileTypeDistribution: (fileTypeDistribution || []).map((item: any) => ({
                file_category: item.file_category,
                file_count: Number(item.file_count),
                total_size: Number(item.total_size)
            })),
            uploadTrends: (uploadTrends || []).map((item: any) => ({
                upload_date: item.upload_date,
                files_uploaded: Number(item.files_uploaded),
                total_size_uploaded: Number(item.total_size_uploaded)
            }))
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

        // Get total allocated quota
        const allocatedQuota = await prisma.$queryRaw`
            SELECT COALESCE(SUM(quota_in_bytes), 0) as total_quota
            FROM users
        `;

        // Get total used storage
        const usedStorage = await prisma.$queryRaw`
            SELECT COALESCE(SUM(file_size_in_bytes), 0) as total_size
            FROM file_index
        `;

        // Get users over 90% quota
        const usersOverQuota = await prisma.$queryRaw<{ username: string; quota_in_bytes: bigint; used_storage: bigint; usage_percentage: number }[]>`
            SELECT 
                u.username,
                u.quota_in_bytes,
                COALESCE(SUM(f.file_size_in_bytes), 0) as used_storage,
                ROUND((COALESCE(SUM(f.file_size_in_bytes), 0) / NULLIF(u.quota_in_bytes, 0)) * 100, 2) as usage_percentage
            FROM users u
            LEFT JOIN file_index f ON u.id = f.user_id
            GROUP BY u.id, u.username, u.quota_in_bytes
            HAVING usage_percentage >= 90
            ORDER BY usage_percentage DESC
        `;

        // Get largest files
        const largestFiles = await prisma.$queryRaw<{ id: string; name: string; size: bigint; date: Date; username: string }[]>`
            SELECT 
                f.id,
                f.original_name as name,
                f.file_size_in_bytes as size,
                f.date_added as date,
                u.username
            FROM file_index f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.file_size_in_bytes DESC
            LIMIT 10
        `;

        return {
            quotaUsage: {
                total_users: Number(totalUsers),
                total_allocated_quota: Number((allocatedQuota as any[])[0]?.total_quota || 0),
                total_used_storage: Number((usedStorage as any[])[0]?.total_size || 0),
                total_files: Number(totalFiles),
                total_groups: Number(totalGroups)
            },
            usersOverQuota: (usersOverQuota || []).map((user: any) => ({
                username: user.username,
                quota_in_bytes: Number(user.quota_in_bytes),
                used_storage: Number(user.used_storage),
                usage_percentage: Number(user.usage_percentage)
            })),
            largestFiles: (largestFiles || []).map((file: any) => ({
                code: file.id,
                name: file.name,
                size: Number(file.size),
                date: file.date,
                username: file.username
            }))
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

// Group management functions
export async function updateGroupId(currentId: string, newId: string):Promise<{success: boolean, error?: string}> {
    try {
        // Validate inputs
        if (!currentId || !newId) {
            throw new Error('Group ID is required');
        }
        
        if (!/^[a-zA-Z0-9]{6}$/.test(newId)) {
            throw new Error('Group ID must be exactly 6 alphanumeric characters');
        }
        
        // Check if current group exists
        const currentGroup = await prisma.file_groups.findUnique({
            where: { id: currentId }
        });
        if (!currentGroup) {
            throw new Error('Group not found');
        }
        
        // Check if new ID already exists
        const existingGroup = await prisma.file_groups.findUnique({
            where: { id: newId }
        });
        if (existingGroup) {
            throw new Error('Group ID already exists');
        }
        
        // Update database
        await prisma.file_groups.update({
            where: { id: currentId },
            data: { id: newId }
        });
        
        return { success: true };
    } catch(err) {
        console.log(err);
        return { success: false, error: (err as Error).message };
    }
}

export async function updateGroupName(groupId: string, newName: string):Promise<{success: boolean, error?: string}> {
    try {
        // Validate inputs
        if (!groupId || !newName) {
            throw new Error('Group ID and name are required');
        }
        
        // Check if group exists
        const group = await prisma.file_groups.findUnique({
            where: { id: groupId }
        });
        if (!group) {
            throw new Error('Group not found');
        }
        
        // Update database
        await prisma.file_groups.update({
            where: { id: groupId },
            data: { name: newName }
        });
        
        return { success: true };
    } catch(err) {
        console.log(err);
        return { success: false, error: (err as Error).message };
    }
}

// Link management functions
export async function updateLinkId(currentId: string, newId: string):Promise<{success: boolean, error?: string}> {
    try {
        // Validate inputs
        if (!currentId || !newId) {
            throw new Error('Link ID is required');
        }
        
        if (!/^[a-zA-Z0-9]{6}$/.test(newId)) {
            throw new Error('Link ID must be exactly 6 alphanumeric characters');
        }
        
        // Check if current link exists
        const currentLink = await prisma.shared_links.findUnique({
            where: { id: currentId }
        });
        if (!currentLink) {
            throw new Error('Link not found');
        }
        
        // Check if new ID already exists
        const existingLink = await prisma.shared_links.findUnique({
            where: { id: newId }
        });
        if (existingLink) {
            throw new Error('Link ID already exists');
        }
        
        // Update database
        await prisma.shared_links.update({
            where: { id: currentId },
            data: { id: newId }
        });
        
        return { success: true };
    } catch(err) {
        console.log(err);
        return { success: false, error: (err as Error).message };
    }
}

export async function updateLinkUrl(linkId: string, newUrl: string):Promise<{success: boolean, error?: string}> {
    try {
        // Validate inputs
        if (!linkId || !newUrl) {
            throw new Error('Link ID and URL are required');
        }
        
        // Check if link exists
        const link = await prisma.shared_links.findUnique({
            where: { id: linkId }
        });
        if (!link) {
            throw new Error('Link not found');
        }
        
        // Update database
        await prisma.shared_links.update({
            where: { id: linkId },
            data: { url: newUrl }
        });
        
        return { success: true };
    } catch(err) {
        console.log(err);
        return { success: false, error: (err as Error).message };
    }
}