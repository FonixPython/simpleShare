import { Request, Response } from 'express';
import path from "path";
import archiver from "archiver";
import * as auth from "../auth";
import * as uploadActions from "../uploadActions";
import { prisma } from "../db";

const { extractToken } = auth;

export const uploadFile = async (req: Request & Record<string, any>, res: Response) => {
  if (!req.file){return res.status(400).json({error:"No file provided"})}
  let result = await uploadActions.registerUploadInIndex(req);
  if (result === true){
    res.status(200).json({
        error: null,
        message: "Successfully uploaded file!",
        code: req.fileCode,
      });
  } else {res.status(500).json({ error: "Database registration failed" });}
};

export const uploadGroup = async (req: Request & Record<string, any>, res: Response) => {
  if (!req.files || req.files.length === 0) {return res.status(400).json({error:"No files provided"})}
  let result = await uploadActions.registerGroupUploadInIndex(req);
  if (result) {
    res.status(200).json({
      error: null,
      message: "Successfully uploaded files!",
      group: result.group,
      files: result.files
    });
  } else {
    res.status(500).json({ error: "Database registration failed" });
  }
};

export const uploadMultipleIndividual = async (req: Request & Record<string, any>, res: Response) => {
  if (!req.files || req.files.length === 0) {return res.status(400).json({error:"No files provided"})}
  let result = await uploadActions.registerMultipleIndividualUploadsInIndex(req);
  if (result) {
    res.status(200).json({
      error: null,
      message: "Successfully uploaded files!",
      files: result.files
    });
  } else {
    res.status(500).json({ error: "Database registration failed" });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token){return res.sendStatus(401)}
  let user_permission = await auth.validateUserToken(token,null);
  let code = req.params.code
  let deleteSubItems = req.query.deleteSubItems === 'true'
  if (user_permission.level === "none"){return res.sendStatus(401)}
  let delete_result: number = 2;
  if (user_permission.level === "admin"){
    delete_result = await uploadActions.deleteItem(code,deleteSubItems)
  }
  if (user_permission.level === "user"){
    delete_result = await uploadActions.deleteItem(code,deleteSubItems,token)
  }
  switch(delete_result){
    case(0):return res.sendStatus(200);break;
    case(1):return res.sendStatus(404);break;
    case(2):return res.sendStatus(500);break;
    case(3):return res.sendStatus(401);break;
  }
};

export const deleteGroups = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token){return res.sendStatus(401)}
  let user_permission = await auth.validateUserToken(token,null);
  let code = req.params.code
  if (user_permission.level === "none"){return res.sendStatus(401)}
  let delete_result: number = 2;
  if (user_permission.level === "admin"){
    delete_result = await uploadActions.deleteItem(code,true)
  }
  if (user_permission.level === "user"){
    delete_result = await uploadActions.deleteItem(code,true,token)
  }
  switch(delete_result){
    case(0):return res.sendStatus(200);break;
    case(1):return res.sendStatus(404);break;
    case(2):return res.sendStatus(500);break;
    case(3):return res.sendStatus(401);break;
  }
};

export const getFile = async (req: Request, res: Response) => {
  let file_code: string = Array.isArray(req.params.file_code) ? req.params.file_code[0] : req.params.file_code;
  if (file_code.length !== 6) {return res.sendStatus(400);}
  let regex = /\d/;
  if (regex.test(file_code)) {return res.sendStatus(400);}
  let db_result = await uploadActions.retrieveObjectInfo(file_code);
  if (db_result === null) {return res.sendStatus(404);}
  if (db_result.type === "file"){
    let stored_name = db_result.stored_filename;
    let original_name = db_result.original_name;
    const filePath = path.join(process.env.UPLOAD_PATH || './uploads/', stored_name);
    res.setHeader("Content-Type", db_result.mime_type)
    return res.download(filePath, original_name);
  }
  if (db_result.type === "group"){
    res.setHeader("Content-Type", "application/zip")
    let zip_name: string = await uploadActions.sanitizeFilename(db_result.name)
    res.setHeader("Content-Disposition",`attachment; filename="${zip_name}.zip"`)
    const archive = archiver("zip", {zlib: { level: 9 }})
    archive.on("error", (err: Error) => {res.status(500).end();console.log(err)})
    archive.pipe(res)
    for (const file of db_result.files) {
      let file_path = path.join(process.env.UPLOAD_PATH || './uploads/', file.stored_filename)
      archive.file(file_path, {name: file.original_name})
    }
    await archive.finalize()
  }
};

export const checkFile = async (req: Request, res: Response) => {
  let file_code: string = req.body.code;
  if (!file_code || file_code.length !== 6) {return res.status(400).json({ exists: false });}
  let regex = /\d/;
  if (regex.test(file_code)) {return res.status(400).json({ exists: false });}
  let db_result = await uploadActions.retrieveObjectInfo(file_code);
  if (db_result === null) {
    // Check if it's a shared link
    const link = await prisma.shared_links.findUnique({
      where: { id: file_code }
    });
    if (link) {
      return res.status(200).json({
        exists: true,
        type: 'link',
        id: link.id,
        url: link.url,
        created_at: link.created_at
      });
    }
    return res.status(200).json({ exists: false });
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  db_result.exists = true
  return res.status(200).json(db_result);
};

export const createGroupFromFiles = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {return res.sendStatus(401)}
  let user_permission = await auth.validateUserToken(token, null);
  if (user_permission.level === "none" || !user_permission.user_id) {return res.sendStatus(401)}
  
  const { fileIds, groupName } = req.body;
  
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: "No files selected" });
  }
  
  if (!groupName || typeof groupName !== 'string' || groupName.trim() === '') {
    return res.status(400).json({ error: "Group name is required" });
  }
  
  try {
    // Verify all files exist and belong to the user
    const files = await prisma.file_index.findMany({
      where: { id: { in: fileIds } }
    });
    
    if (files.length !== fileIds.length) {
      return res.status(400).json({ error: "Some files do not exist" });
    }
    
    // Check ownership if not admin
    if (user_permission.level !== "admin") {
      const unauthorizedFiles = files.filter(f => f.user_id !== user_permission.user_id);
      if (unauthorizedFiles.length > 0) {
        return res.status(403).json({ error: "Unauthorized access to some files" });
      }
    }
    
    // Generate unique group code
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let groupCode = "";
    while (true) {
      groupCode = "";
      for (let i = 0; i < 6; i++) {
        groupCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await prisma.file_groups.findUnique({ where: { id: groupCode } });
      if (!existing) break;
    }
    
    // Create the group
    await prisma.file_groups.create({
      data: {
        id: groupCode,
        name: groupName.trim(),
        file_ids: JSON.stringify(fileIds),
        user_id: user_permission.user_id
      }
    });
    
    res.status(200).json({
      error: null,
      message: "Group created successfully!",
      group: {
        id: groupCode,
        name: groupName.trim()
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create group" });
  }
};
