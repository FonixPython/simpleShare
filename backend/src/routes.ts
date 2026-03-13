import { Request, Response } from 'express';
const express = require('express');
const path = require("path")
const router = express.Router();
import * as auth from "./auth";
const archiver = require("archiver");
import * as userActions from "./userActions"
import * as adminActions from "./adminActions"
import * as uploadActions from "./uploadActions"
import { request } from 'http';


// Base routes

router.get("/", (req: Request,res:Response) => {
  const devPath = path.join(__dirname, '../client/index.html');
  const prodPath = path.join(__dirname, './public/index.html');
  const fs = require('fs');
  const useDev = fs.existsSync(devPath);
  const indexPath = useDev ? devPath : prodPath;
  return res.sendFile(indexPath);
})

router.get("/admin",async (req:Request, res:Response)=>{
  if (!req.cookies.session_token) {return res.redirect("/")}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! You must be an admin to see this page!"})}
  const devPath = path.join(__dirname, '../client/index.html');
  const prodPath = path.join(__dirname, './public/index.html');
  const fs = require('fs');
  const useDev = fs.existsSync(devPath);
  const indexPath = useDev ? devPath : prodPath;
  return res.sendFile(indexPath);
})


// Admin action API endpoints

router.post('/register', async (req:Request,res:Response)=>{
  if (!req.headers.authorization){return res.sendStatus(401)}
  let new_username = req.body.username;
  let new_password = req.body.password;
  let is_admin = req.body.isAdmin || false;
  let quota = req.body.quota || 52428800;
  if(!new_username || !new_password){return res.status(400).json({message:"Invalid request! Username and passowrd are required!"})}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.headers.authorization,"admin")
  if (user_permission.met === false){return res.sendStatus(401)}
  let register_result = await adminActions.registerUser(new_username,new_password,is_admin,quota)
  if (register_result === 0){return res.sendStatus(200)}
  if (register_result === 1){return res.sendStatus(409)}
  if (register_result === 2){return res.sendStatus(500)}
})


router.post('/admin/user/changePassword', async (req:Request,res:Response)=>{
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
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
})

router.post('/admin/user/changeUsername', async (req:Request,res:Response)=>{
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
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
})

router.post('/admin/user/changeQuota', async (req:Request,res:Response)=>{
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
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
})

router.post('/admin/user/changeAdminStatus', async (req:Request,res:Response)=>{
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
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
})

router.post('/admin/user/delete', async (req:Request,res:Response)=>{
  if (!req.cookies.session_token) {return res.status(401).json({error:"Unauthorized!"})}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! Admin access required!"})}
  
  let target_user_id = req.body.userId;
  
  if (!target_user_id){return res.status(400).json({error:"userId is required!"})}
  
  let result = await adminActions.deleteUser(target_user_id);
  switch(result){
    case 0: return res.status(200).json({message:"User deleted successfully!"});
    case 1: return res.status(404).json({error:"User not found!"});
    case 2: return res.status(500).json({error:"Server error!"});
  }
})

router.get("/admin/getGlobalLimit", async (req:Request, res:Response)=>{
  if (!req.cookies.session_token) {return res.status(401)}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
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
});

router.get("/admin/getGlobalStorage", async (req:Request, res:Response)=>{
  if (!req.cookies.session_token) {return res.status(401)}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
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
});

router.get("/admin/getStorageSettings", async (req:Request, res:Response)=>{
  if (!req.cookies.session_token) {return res.status(401)}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
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
});

router.post("/admin/updateStorageLimit", async (req:Request, res:Response)=>{
  if (!req.cookies.session_token) {return res.status(401)}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.cookies.session_token,"admin");
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
});

// User action API endpoints


router.post("/login",async (req:Request,res:Response)=>{
  let username:string = req.body.username;
  let password:string = req.body.password;
  if (!username || !password){
    return res.status(400).json({
      status: 400,
      error: "Username and password is required for autentication!",
    });
  }
  let login_result = await auth.loginUser(username=username,password=password,req.headers['user-agent'] || null)
  if (login_result.success){
    res.cookie("session_token", login_result.token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 // 1 day
        });
    return res.status(200).json({ status: 200, error: login_result.message, token: login_result.token });
  }
  else{return res.status(400).json({ status: 400, error: login_result.message, token: null });}
})

router.get("/logout", async (req:Request,res:Response)=>{
  if (!req.headers.authorization) {return res.status(400)}
  let logout_result = await auth.logoutUser(req.headers.authorization);
  if (logout_result){return res.sendStatus(200)}
  else {return res.sendStatus(500)}
})

router.get("/verifySession",async (req:Request,res:Response)=>{
  if (!req.headers.authorization){return res.status(401)}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.headers.authorization,null);
  if (user_permission.level !== "none"){return res.status(200).json({permission:user_permission.level})}
  else {return res.status(401).json({permission:user_permission.level})}
})

router.get("/quota",async (req:Request,res:Response)=>{
  if (!req.headers.authorization) return res.sendStatus(401);
  let user_permission:auth.PermissionResponse=await auth.validateUserToken(req.headers.authorization,null)
  if (user_permission.level === "none"){return res.sendStatus(401)}
  let total_quota:Number = await userActions.getTotalQuota(user_permission.user_id)
  let used_quota:Number = await userActions.getUsedQuota(user_permission.user_id)
  let used_quota_value =used_quota && used_quota ? used_quota : 0;
  let total_quota_value = total_quota ? total_quota : 0;
  return res.status(200).json({
    total: Number(total_quota_value),
    used: Number(used_quota_value),
  });

})

router.get("/getAllFiles",async (req:Request,res:Response)=>{
  if (!req.headers.authorization){return res.sendStatus(401)}
  let user_permission:auth.PermissionResponse=await auth.validateUserToken(req.headers.authorization,null)
  if (user_permission.level === "none"){return res.sendStatus(401)}
  let files = await userActions.getAllFiles(user_permission.user_id)
  return res.status(200).json(files)
})

router.post("/changePassword", async (req:Request,res:Response)=>{
  if (!req.headers.authorization){return res.sendStatus(401)}
  if (!req.body.old_password || !req.body.new_password){return res.sendStatus(400)}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.headers.authorization,null);
  if (user_permission.level === "none") {return res.sendStatus(401)}
  let action_result:Number = await userActions.changePassword(user_permission.user_id,req.body.old_password,req.body.new_password)

  switch (action_result){
    case(0):res.sendStatus(200);break;
    case(1):res.status(400).json({message:"New password cannot be the same as old password!"});break;
    case(2):res.sendStatus(401);break;
    case(3):res.sendStatus(500);console.log("Invalid user_id?!?!?!?");break;
    case(4):res.sendStatus(500);break;
  }
})

router.post("/upload",auth.authenticateUser,uploadActions.prepareUploadContext,uploadActions.uploadMiddleware,async (req:Request & Record<string, any>,res:Response)=>{
  if (!req.file){return res.status(400).json({error:"No file provided"})}
  let result = await uploadActions.registerUploadInIndex(req);
  if (result === true){
    res.status(200).json({
        error: null,
        message: "Successfully uploaded file!",
        code: req.fileCode,
      });
  } else {res.status(500).json({ error: "Database registration failed" });}
})

router.post("/upload-group", auth.authenticateUser, uploadActions.prepareGroupUploadContext, uploadActions.uploadGroupMiddleware, async (req: Request & Record<string, any>, res: Response) => {
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
})

router.post("/upload-multiple-individual", auth.authenticateUser, uploadActions.prepareGroupUploadContext, uploadActions.uploadGroupMiddleware, async (req: Request & Record<string, any>, res: Response) => {
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
})

router.get("/delete/:code",async(req:Request,res:Response)=>{
  if (!req.headers.authorization){return res.sendStatus(401)}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.headers.authorization,null);
  let code=req.params.code
  let deleteSubItems = req.query.deleteSubItems === 'true'
  if (user_permission.level === "none"){return res.sendStatus(401)}
  let delete_result:Number=2;
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
})

router.get("/delete-groups/:code",async (req:Request,res:Response)=>{
  if (!req.headers.authorization){return res.sendStatus(401)}
  let user_permission:auth.PermissionResponse = await auth.validateUserToken(req.headers.authorization,null);
  let code=req.params.code
  if (user_permission.level === "none"){return res.sendStatus(401)}
  let delete_result:Number=2;
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
})

router.get("/files/:file_code", async (req:Request, res:Response) => {
  let file_code:string = Array.isArray(req.params.file_code) ? req.params.file_code[0] : req.params.file_code;
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
    let zip_name:string = await uploadActions.sanitizeFilename(db_result.name)
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
});

router.post("/checkFile", async (req:Request,res:Response)=>{
  let file_code:string = req.body.code;
  if (!file_code || file_code.length !== 6) {return res.status(400).json({ exists: false});}
  let regex = /\d/;
  if (regex.test(file_code)) {return res.status(400).json({ exists: false });}
  let db_result = await uploadActions.retrieveObjectInfo(file_code);
  if (db_result === null) {return res.status(200).json({ exists: false });}
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  db_result.exists=true
  return res.status(200).json(db_result);
})

export default router;