const multer = require("multer");
const path = require("path")
import { Request, Response, NextFunction } from 'express';
import { FileFilterCallback } from "multer";
require("dotenv").config();
const pool = require("./db");

async function getTotalStorageUsed():Promise<number | null> {
  try {
    const result = await pool.query("SELECT SUM(file_size_in_bytes) AS total_used FROM file_index",);
    return Number(result[0].total_used || 0);
  } catch(err){console.log(err);return null}
}

async function getGlobalStorageLimit():Promise<number | null> {
  try {
    const result = await pool.query("SELECT num_value FROM settings WHERE name = ?",["global-storage-limit"]);
    return result.length > 0 ? Number(BigInt(result[0].num_value)) : 0;
  } catch(err){console.log(err);return null}
}

async function calculateRemainingGlobalStorage() {
  const totalLimit:number = await getGlobalStorageLimit() || 1;
  if (totalLimit === 0) return null; // Unlimited
  const totalUsed:number = await getTotalStorageUsed() || 1;
  return totalLimit - totalUsed;
}

async function calculateRemainFromQuota(user_id:string):Promise<number | null> {
  try {
    let result = await pool.query("SELECT quota_in_bytes FROM users WHERE id = ?",[user_id]);
    if (result.length === 0) return 0;
    let quota:number = Number(result[0].quota_in_bytes);
    if (quota == 0) return null;
    let used_res = await pool.query("SELECT SUM(file_size_in_bytes) AS total_used FROM file_index WHERE user_id = ?",[user_id]);
    let used_up:number = Number(used_res[0].total_used || 0)
    let remaining:number = quota - used_up
    return remaining;
  } catch(err){console.log(err);return 1}
}

export async function registerUploadInIndex(req:Request& Record<string, any>) {
  try {
    if (!req.file) throw new Error("No file uploaded");
    
    // Rename the file to use the file code
    const ext = path.extname(req.file.originalname);
    const newFilename = `${req.fileCode}${ext}`;
    
    // Rename the file on disk
    const fs = require('fs');
    const oldPath = path.join(process.env.UPLOAD_PATH || './uploads', req.file.filename);
    const newPath = path.join(process.env.UPLOAD_PATH || './uploads', newFilename);
    
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }
    
    let res = await pool.query(
      "INSERT INTO file_index(id, mime_type, stored_filename, original_name, file_size_in_bytes, user_id) VALUES (?,?,?,?,?,?)",
      [
        req.fileCode,
        req.file.mimetype,
        newFilename,
        req.file.originalname,
        req.file.size,
        req.user.id,
      ],
    );
    return !!res;
  } catch(err){console.log(err)}
}

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_PATH || "./uploads",
  filename: function (req:Request& Record<string, any>, file:Express.Multer.File, cb: (error: Error | null, filename: string)=>void){
    const ext = path.extname(file.originalname);
    // For single file upload, use a temporary name first, will be renamed later
    const filename = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${ext}`;
    cb(null, filename);
  },
});

export const uploadMiddleware = (req:Request& Record<string, any>, res:Response, next:NextFunction) => {
  const limits = {} as { [key: string]: any };
  if (req.maxUploadSize) {limits.fileSize = req.maxUploadSize;}

  const upload = multer({
    storage: storage,
    limits: limits,
  }).single("file");

  upload(req, res, (err:Error) => {
    if (err) return next(err);
    next();
  });
};

async function generateUniqueCode(code_length:number) {
  try {
    const chars:string = "abcdefghijklmnopqrstuvwxyz";
    while (true) {
      let result:string = "";
      for (let i = 0; i < code_length; i++) {result += chars.charAt(Math.floor(Math.random() * chars.length));}
      let res = await pool.query("SELECT * FROM file_groups WHERE id = ?", [result]);
      let res2 = await pool.query("SELECT * FROM file_index WHERE id = ?", [result]);
      if (res.length == 0 && res2.length==0) {return result}
    }
  } catch(err){console.log(err)}
}

export const uploadGroupMiddleware = (req:Request& Record<string, any>, res:Response, next:NextFunction) => {
  const limits = {} as { [key: string]: any };
  if (req.maxUploadSize) {limits.fileSize = req.maxUploadSize;}

  const upload = multer({
    storage: storage,
    limits: limits,
  }).array("files");

  upload(req, res, (err:Error) => {
    if (err) return next(err);
    next();
  });
};

export async function prepareGroupUploadContext(req:Request& Record<string, any>, res:Response, next:NextFunction) {
  const groupCode:string | undefined = await generateUniqueCode(6);
  if (groupCode === undefined){return res.sendStatus(500)}
  req.groupCode = groupCode;

  // Check global storage limit first
  const globalRemaining = await calculateRemainingGlobalStorage();
  if (globalRemaining !== null && globalRemaining <= 0) {return res.status(500).json({ error: "Global storage limit reached" });}

  // Check user quota
  let remaining = await calculateRemainFromQuota(req.user.id)
  
  if (remaining !== null) {
    if (remaining < BigInt(0)) {return res.sendStatus(413);}
    req.maxUploadSize = remaining;
  } 
  else if (globalRemaining !== null && remaining === null) {
    if (globalRemaining <= 0) {res.sendStatus(500);} 
    else {req.maxUploadSize = globalRemaining;}
  }

  // Apply global storage limit to max upload size if it's more restrictive
  if (globalRemaining !== null && remaining !== null && remaining > globalRemaining) {
    if (globalRemaining <= 0) {res.sendStatus(500);} 
    else {req.maxUploadSize = globalRemaining;}
  }

  next();
}

export async function registerGroupUploadInIndex(req:Request& Record<string, any>) {
  try {
    if (!req.files || req.files.length === 0) throw new Error("No files uploaded");
    
    const groupName = req.body.groupName || 'Untitled Group';
    const fileIds: string[] = [];
    const uploadedFiles: any[] = [];

    // First, register all files in the file_index table
    for (const file of req.files as Express.Multer.File[]) {
      const fileCode:string | undefined = await generateUniqueCode(6);
      if (fileCode === undefined){throw new Error("For some reason the file code is undefined????"+fileCode)}
      fileIds.push(fileCode);
      
      // Update the filename to include the file code
      const ext = path.extname(file.originalname);
      const newFilename = `${fileCode}${ext}`;
      
      // Rename the file on disk
      const fs = require('fs');
      const oldPath = path.join(process.env.UPLOAD_PATH || './uploads', file.filename);
      const newPath = path.join(process.env.UPLOAD_PATH || './uploads', newFilename);
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
      
      // Register file in database
      await pool.query(
        "INSERT INTO file_index(id, mime_type, stored_filename, original_name, file_size_in_bytes, user_id) VALUES (?,?,?,?,?,?)",
        [
          fileCode,
          file.mimetype,
          newFilename,
          file.originalname,
          file.size,
          req.user.id,
        ],
      );

      uploadedFiles.push({
        code: fileCode,
        originalname: file.originalname,
        size: file.size
      });
    }

    // Then create the group entry
    await pool.query(
      "INSERT INTO file_groups(id, name, file_ids, user_id, created_at) VALUES (?,?,?,?,?)",
      [
        req.groupCode,
        groupName,
        JSON.stringify(fileIds),
        req.user.id,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
      ],
    );

    return {
      group: {
        id: req.groupCode,
        name: groupName
      },
      files: uploadedFiles
    };
  } catch(err){console.log(err);return null}
}

export async function prepareUploadContext(req:Request& Record<string, any>, res:Response, next:NextFunction) {
  const code = await generateUniqueCode(6);
  req.fileCode = code;

  // Check global storage limit first
  const globalRemaining = await calculateRemainingGlobalStorage();
  if (globalRemaining !== null && globalRemaining <= 0) {return res.status(500).json({ error: "Global storage limit reached" });}

  // Check user quota
  let remaining = await calculateRemainFromQuota(req.user.id)
  
  if (remaining !== null) {
    if (remaining < BigInt(0)) {return res.sendStatus(413);}
    req.maxUploadSize = remaining;
  } 
  else if (globalRemaining !== null && remaining === null) {
    if (globalRemaining <= 0) {res.sendStatus(500);} 
    else {req.maxUploadSize = globalRemaining;}
  }

  // Apply global storage limit to max upload size if it's more restrictive
  if (globalRemaining !== null && remaining !== null && remaining > globalRemaining) {
    if (globalRemaining <= 0) {res.sendStatus(500);} 
    else {req.maxUploadSize = globalRemaining;}
  }

  next();
}
