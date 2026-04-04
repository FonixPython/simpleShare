import { Request, Response } from 'express';
import { prisma } from '../db';
import * as auth from "../auth";
import * as adminActions from "../adminActions";
import * as uploadActions from "../uploadActions";

export const registerUser = async (req: Request, res: Response) => {
  if (!req.headers.authorization){return res.sendStatus(401)}
  let new_username = req.body.username;
  let new_password = req.body.password;
  let is_admin = req.body.isAdmin || false;
  let quota = req.body.quota || 52428800;
  if(!new_username || !new_password){return res.status(400).json({message:"Invalid request! Username and passowrd are required!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin")
  if (user_permission.met === false){return res.sendStatus(401)}
  let register_result = await adminActions.registerUser(new_username,new_password,is_admin,quota)
  if (register_result === 0){return res.sendStatus(200)}
  if (register_result === 1){return res.sendStatus(409)}
  if (register_result === 2){return res.sendStatus(500)}
};

export const changeUserPassword = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let target_user_id = req.body.userId;
  let new_password = req.body.newPassword;
  
  if (!target_user_id || !new_password){return res.status(400).json({error:"userId and newPassword are required!"})}
  
  let result = await adminActions.changeUserPassword(target_user_id, new_password);
  switch(result){
    case 0: return res.status(200).json({message:"Password changed successfully!"});
    case 1: return res.status(404).json({error:"User not found!"});
    case 2: return res.status(500).json({error:"Server error!"});
  }
};

export const changeUsername = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let target_user_id = req.body.userId;
  let new_username = req.body.newUsername;
  
  if (!target_user_id || !new_username){return res.status(400).json({error:"userId and newUsername are required!"})}
  
  let result = await adminActions.changeUsername(target_user_id, new_username);
  switch(result){
    case 0: return res.status(200).json({message:"Username changed successfully!"});
    case 1: return res.status(404).json({error:"User not found!"});
    case 2: return res.status(409).json({error:"Username already exists!"});
    case 3: return res.status(500).json({error:"Server error!"});
  }
};

export const changeUserQuota = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let target_user_id = req.body.userId;
  let new_quota = req.body.newQuota;
  
  if (!target_user_id || new_quota === undefined){return res.status(400).json({error:"userId and newQuota are required!"})}
  
  let result = await adminActions.changeUserQuota(target_user_id, new_quota);
  switch(result){
    case 0: return res.status(200).json({message:"Quota changed successfully!"});
    case 1: return res.status(404).json({error:"User not found!"});
    case 2: return res.status(500).json({error:"Server error!"});
  }
};

export const changeUserAdminStatus = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let target_user_id = req.body.userId;
  let is_admin = req.body.isAdmin;
  
  if (!target_user_id || is_admin === undefined){return res.status(400).json({error:"userId and isAdmin are required!"})}
  
  let result = await adminActions.changeUserAdminStatus(target_user_id, is_admin);
  switch(result){
    case 0: return res.status(200).json({message:"Admin status changed successfully!"});
    case 1: return res.status(404).json({error:"User not found!"});
    case 2: return res.status(500).json({error:"Server error!"});
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let target_user_id = req.body.userId;
  
  if (!target_user_id){return res.status(400).json({error:"userId is required!"})}
  
  let result = await adminActions.deleteUser(target_user_id);
  switch(result){
    case 0: return res.status(200).json({message:"User deleted successfully!"});
    case 1: return res.status(404).json({error:"User not found!"});
    case 2: return res.status(500).json({error:"Server error!"});
  }
};

export const getGlobalLimit = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401)}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! You must be an admin to see this page!"})}
  try{
    const total_limit = await uploadActions.getGlobalStorageLimit();
    const total_used = await uploadActions.getTotalStorageUsed();
    if (total_limit === null || total_used === null) {return res.status(500).json({message:"Shit hit the fan!"})}
    const remaining = total_limit === 0 ? null : total_limit - total_used;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({
        limit: total_limit,
        used: total_used,
        remaining: remaining,
        percentage:
          total_limit === 0 ? 0 : Math.round((total_used / total_limit) * 100),
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to retrieve storage statistics" })
  }
};

export const getGlobalStorage = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401)}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! You must be an admin to see this page!"})}
  try{
    const total_limit = await uploadActions.getGlobalStorageLimit();
    const total_used = await uploadActions.getTotalStorageUsed();
    const total_users = await adminActions.getTotalUsers();
    const total_files = await uploadActions.getTotalFiles();
    
    if (total_limit === null || total_used === null) {return res.status(500).json({message:"Failed to retrieve storage statistics!"})}
    
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({
        totalUsers: total_users || 0,
        totalFiles: total_files || 0,
        totalStorage: total_used || 0,
        limit: total_limit,
        used: total_used,
        remaining: total_limit === 0 ? null : total_limit - total_used,
        percentage: total_limit === 0 ? 0 : Math.round((total_used / total_limit) * 100),
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to retrieve storage statistics" })
  }
};

export const getStorageSettings = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401)}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! You must be an admin to see this page!"})}
  try{
    const global_limit = await uploadActions.getGlobalStorageLimit();
    const total_used = await uploadActions.getTotalStorageUsed();
    const total_users = await adminActions.getTotalUsers();
    const total_files = await uploadActions.getTotalFiles();
    
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({
      globalStorageLimit: global_limit || 0,
      totalStorageUsed: total_used || 0,
      totalUsers: total_users || 0,
      totalFiles: total_files || 0,
      remainingStorage: (global_limit || 0) === 0 ? null : ((global_limit || 0) - (total_used || 0)),
      usagePercentage: (global_limit || 0) === 0 ? 0 : Math.round(((total_used || 0) / (global_limit || 0)) * 100)
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to retrieve storage settings" })
  }
};

export const getAllUsersWithFiles = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let users = await adminActions.getAllUsersWithFiles();
  if (users === null){return res.status(500).json({error:"Server error!"})}
  
  // Fix BigInt serialization issue
  const json = JSON.stringify(users, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
  
  res.setHeader('Content-Type', 'application/json');
  return res.send(json);
};

export const getAllFiles = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let files = await adminActions.getAllFiles();
  if (files === null){return res.status(500).json({error:"Server error!"})}
  
  // Fix BigInt serialization issue
  const json = JSON.stringify(files, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
  
  res.setHeader('Content-Type', 'application/json');
  return res.send(json);
};

export const getGroupDetails = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const groupCode = Array.isArray(req.params.groupCode) ? req.params.groupCode[0] : req.params.groupCode;
  if (!groupCode) {return res.status(400).json({error:"Group code is required!"})}
  
  let groupDetails = await adminActions.getGroupDetails(groupCode);
  if (groupDetails === null){return res.status(404).json({error:"Group not found!"})}
  
  // Fix BigInt serialization issue
  const json = JSON.stringify(groupDetails, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
  
  res.setHeader('Content-Type', 'application/json');
  return res.send(json);
};

export const getUserStatistics = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let stats = await adminActions.getUserStatistics();
  if (stats === null){return res.status(500).json({error:"Server error!"})}
  
  // Fix BigInt serialization issue
  const json = JSON.stringify(stats, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
  
  res.setHeader('Content-Type', 'application/json');
  return res.send(json);
};

export const getFileTypeStatistics = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let stats = await adminActions.getFileTypeStatistics();
  if (stats === null){return res.status(500).json({error:"Server error!"})}
  
  // Fix BigInt serialization issue
  const json = JSON.stringify(stats, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
  
  res.setHeader('Content-Type', 'application/json');
  return res.send(json);
};

export const getSystemHealthMetrics = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let metrics = await adminActions.getSystemHealthMetrics();
  if (metrics === null){return res.status(500).json({error:"Server error!"})}
  
  // Fix BigInt serialization issue
  const json = JSON.stringify(metrics, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
  
  res.setHeader('Content-Type', 'application/json');
  return res.send(json);
};

export const deleteFile = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const fileCode = req.params.fileCode;
  if (!fileCode) {return res.status(400).json({error:"File code is required!"})}
  
  try {
    const uploadActions = require('../uploadActions');
    const delete_result = await uploadActions.deleteItem(fileCode, true);
    
    switch(delete_result){
      case(0): return res.status(200).json({success: true});
      case(1): return res.status(404).json({error: "File not found!"});
      case(2): return res.status(500).json({error: "Server error!"});
      case(3): return res.status(401).json({error: "Unauthorized!"});
      default: return res.status(500).json({error: "Unknown error occurred!"});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to delete file" })
  }
};

export const updateStorageLimit = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.status(401)}
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! You must be an admin to see this page!"})}
  
  const newLimit = req.body.limit;
  if (newLimit === undefined || newLimit < 0) {return res.status(400).json({error:"Invalid storage limit provided!"})}
  
  try{
    const result = await adminActions.updateGlobalStorageLimit(newLimit);
    switch(result){
      case 0: return res.status(200).json({message:"Global storage limit updated successfully!"});
      case 1: return res.status(500).json({error:"Failed to update storage limit!"});
      default: return res.status(500).json({error:"Unknown error occurred!"});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update storage limit" })
  }
};

// File management endpoints

export const updateFileId = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const { currentId, newId } = req.body;
  
  if (!currentId || !newId) {
    return res.status(400).json({error:"currentId and newId are required!"});
  }
  
  try {
    const result = await adminActions.updateFileId(currentId, newId);
    
    if (result.success) {
      return res.status(200).json({success: true, message: "File ID updated successfully!"});
    } else {
      return res.status(400).json({error: result.error || "Failed to update file ID!"});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update file ID" });
  }
};

export const updateFileName = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const { fileId, newName } = req.body;
  
  if (!fileId || !newName) {
    return res.status(400).json({error:"fileId and newName are required!"});
  }
  
  try {
    const result = await adminActions.updateFileName(fileId, newName);
    
    if (result.success) {
      return res.status(200).json({success: true, message: "File name updated successfully!"});
    } else {
      return res.status(400).json({error: result.error || "Failed to update file name!"});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update file name" });
  }
};

// Group management endpoints

export const updateGroupId = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const { currentId, newId } = req.body;
  
  if (!currentId || !newId) {
    return res.status(400).json({error:"currentId and newId are required!"});
  }
  
  try {
    const result = await adminActions.updateGroupId(currentId, newId);
    
    if (result.success) {
      return res.status(200).json({success: true, message: "Group ID updated successfully!"});
    } else {
      return res.status(400).json({error: result.error || "Failed to update group ID!"});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update group ID" });
  }
};

export const updateGroupName = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const { groupId, newName } = req.body;
  
  if (!groupId || !newName) {
    return res.status(400).json({error:"groupId and newName are required!"});
  }
  
  try {
    const result = await adminActions.updateGroupName(groupId, newName);
    
    if (result.success) {
      return res.status(200).json({success: true, message: "Group name updated successfully!"});
    } else {
      return res.status(400).json({error: result.error || "Failed to update group name!"});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update group name" });
  }
};

// Link management endpoints

export const updateLinkId = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const { currentId, newId } = req.body;
  
  if (!currentId || !newId) {
    return res.status(400).json({error:"currentId and newId are required!"});
  }
  
  try {
    const result = await adminActions.updateLinkId(currentId, newId);
    
    if (result.success) {
      return res.status(200).json({success: true, message: "Link ID updated successfully!"});
    } else {
      return res.status(400).json({error: result.error || "Failed to update link ID!"});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update link ID" });
  }
};

export const updateLinkUrl = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const { linkId, newUrl } = req.body;
  
  if (!linkId || !newUrl) {
    return res.status(400).json({error:"linkId and newUrl are required!"});
  }
  
  try {
    const result = await adminActions.updateLinkUrl(linkId, newUrl);
    
    if (result.success) {
      return res.status(200).json({success: true, message: "Link URL updated successfully!"});
    } else {
      return res.status(400).json({error: result.error || "Failed to update link URL!"});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update link URL" });
  }
};

// Database management functions

const ALLOWED_TABLES = ['users', 'file_index', 'file_groups', 'settings', 'session_tokens', 'shared_links'];

export const getDatabaseTables = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  return res.status(200).json({
    tables: [
      { name: 'users', label: 'Users', description: 'User accounts and settings' },
      { name: 'file_index', label: 'Files', description: 'Uploaded files index' },
      { name: 'file_groups', label: 'File Groups', description: 'File collections/groups' },
      { name: 'settings', label: 'Settings', description: 'System settings' },
      { name: 'session_tokens', label: 'Sessions', description: 'Active user sessions (read-only recommended)' },
      { name: 'shared_links', label: 'Shared Links', description: 'User shared links' }
    ]
  });
};

export const getTableData = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const tableName = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({error: "Invalid table name"});
  }
  
  try {
    let data: any[] = [];
    let columns: string[] = [];
    
    switch(tableName) {
      case 'users':
        data = await prisma.users.findMany({ orderBy: { username: 'asc' } });
        columns = ['id', 'username', 'password_hash', 'quota_in_bytes', 'is_admin', 'date_of_creation'];
        break;
      case 'file_index':
        data = await prisma.file_index.findMany({ orderBy: { date_added: 'desc' } });
        columns = ['id', 'visibility', 'date_added', 'file_size_in_bytes', 'stored_filename', 'original_name', 'mime_type', 'user_id'];
        break;
      case 'file_groups':
        data = await prisma.file_groups.findMany({ orderBy: { created_at: 'desc' } });
        columns = ['id', 'name', 'file_ids', 'user_id', 'created_at'];
        break;
      case 'settings':
        data = await prisma.settings.findMany({ orderBy: { name: 'asc' } });
        columns = ['name', 'num_value', 'text_value', 'comment'];
        break;
      case 'session_tokens':
        data = await prisma.session_tokens.findMany({ orderBy: { added_on: 'desc' } });
        columns = ['token', 'user_id', 'is_valid', 'user_agent', 'added_on'];
        break;
      case 'shared_links':
        data = await prisma.shared_links.findMany({ orderBy: { created_at: 'desc' } });
        columns = ['id', 'url', 'user_id', 'created_at'];
        break;
    }
    
    // Serialize BigInt values
    const serializedData = JSON.parse(JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    ));
    
    return res.status(200).json({ columns, data: serializedData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to fetch table data" });
  }
};

export const updateTableRow = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const tableName = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
  const { primaryKey, updates } = req.body;
  
  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({error: "Invalid table name"});
  }
  
  try {
    let result;
    
    switch(tableName) {
      case 'users':
        if (updates.password_hash && !updates.password_hash.startsWith('$2')) {
          return res.status(400).json({error: "Password must be hashed. Use the password change function instead."});
        }
        result = await prisma.users.update({
          where: { id: primaryKey },
          data: {
            ...updates,
            quota_in_bytes: updates.quota_in_bytes !== undefined ? BigInt(updates.quota_in_bytes) : undefined
          }
        });
        break;
      case 'file_index':
        result = await prisma.file_index.update({
          where: { id: primaryKey },
          data: {
            ...updates,
            file_size_in_bytes: updates.file_size_in_bytes !== undefined ? BigInt(updates.file_size_in_bytes) : undefined
          }
        });
        break;
      case 'file_groups':
        result = await prisma.file_groups.update({
          where: { id: primaryKey },
          data: updates
        });
        break;
      case 'settings':
        result = await prisma.settings.update({
          where: { name: primaryKey },
          data: {
            ...updates,
            num_value: updates.num_value !== undefined ? (updates.num_value !== null ? BigInt(updates.num_value) : null) : undefined
          }
        });
        break;
      case 'session_tokens':
        result = await prisma.session_tokens.update({
          where: { token: primaryKey },
          data: updates
        });
        break;
      case 'shared_links':
        result = await prisma.shared_links.update({
          where: { id: primaryKey },
          data: updates
        });
        break;
      default:
        return res.status(400).json({error: "Table not supported for updates"});
    }
    
    return res.status(200).json({success: true, message: "Row updated successfully"});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update row" });
  }
};

export const deleteTableRow = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const tableName = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
  const { primaryKey } = req.body;
  
  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({error: "Invalid table name"});
  }
  
  try {
    switch(tableName) {
      case 'users':
        await prisma.users.delete({ where: { id: primaryKey } });
        break;
      case 'file_index':
        await prisma.file_index.delete({ where: { id: primaryKey } });
        break;
      case 'file_groups':
        await prisma.file_groups.delete({ where: { id: primaryKey } });
        break;
      case 'settings':
        await prisma.settings.delete({ where: { name: primaryKey } });
        break;
      case 'session_tokens':
        await prisma.session_tokens.delete({ where: { token: primaryKey } });
        break;
      case 'shared_links':
        await prisma.shared_links.delete({ where: { id: primaryKey } });
        break;
      default:
        return res.status(400).json({error: "Table not supported for deletion"});
    }
    
    return res.status(200).json({success: true, message: "Row deleted successfully"});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to delete row" });
  }
};

export const insertTableRow = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission = await auth.validateUserToken(req.headers.authorization,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  const tableName = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
  const { data } = req.body;
  
  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({error: "Invalid table name"});
  }
  
  try {
    let result;
    
    switch(tableName) {
      case 'users':
        return res.status(400).json({error: "Use the register endpoint to create new users"});
      case 'file_index':
        result = await prisma.file_index.create({
          data: {
            ...data,
            file_size_in_bytes: data.file_size_in_bytes !== undefined ? BigInt(data.file_size_in_bytes) : undefined
          }
        });
        break;
      case 'file_groups':
        result = await prisma.file_groups.create({ data });
        break;
      case 'settings':
        result = await prisma.settings.create({
          data: {
            ...data,
            num_value: data.num_value !== undefined ? BigInt(data.num_value) : undefined
          }
        });
        break;
      case 'session_tokens':
        return res.status(400).json({error: "Cannot manually insert session tokens"});
      case 'shared_links':
        result = await prisma.shared_links.create({ data });
        break;
      default:
        return res.status(400).json({error: "Table not supported for insertion"});
    }
    
    return res.status(200).json({success: true, message: "Row inserted successfully"});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to insert row" });
  }
};
