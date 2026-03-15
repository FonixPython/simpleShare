import { Request, Response } from 'express';
const path = require("path");
const archiver = require("archiver");
import * as auth from "../auth";
import * as uploadActions from "../uploadActions";

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
  if (!req.headers.authorization){return res.sendStatus(401)}
  let user_permission = await auth.validateUserToken(req.headers.authorization,null);
  let code = req.params.code
  let deleteSubItems = req.query.deleteSubItems === 'true'
  if (user_permission.level === "none"){return res.sendStatus(401)}
  let delete_result: number = 2;
  if (user_permission.level === "admin"){
    delete_result = await uploadActions.deleteItem(code,deleteSubItems)
  }
  if (user_permission.level === "user"){
    delete_result = await uploadActions.deleteItem(code,deleteSubItems,req.headers.authorization)
  }
  switch(delete_result){
    case(0):return res.sendStatus(200);break;
    case(1):return res.sendStatus(404);break;
    case(2):return res.sendStatus(500);break;
    case(3):return res.sendStatus(401);break;
  }
};

export const deleteGroups = async (req: Request, res: Response) => {
  if (!req.headers.authorization){return res.sendStatus(401)}
  let user_permission = await auth.validateUserToken(req.headers.authorization,null);
  let code = req.params.code
  if (user_permission.level === "none"){return res.sendStatus(401)}
  let delete_result: number = 2;
  if (user_permission.level === "admin"){
    delete_result = await uploadActions.deleteItem(code,true)
  }
  if (user_permission.level === "user"){
    delete_result = await uploadActions.deleteItem(code,true,req.headers.authorization)
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
  if (db_result === null) {return res.status(200).json({ exists: false });}
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  db_result.exists = true
  return res.status(200).json(db_result);
};
