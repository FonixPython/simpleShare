import { response } from 'express';
import { Request, Response } from 'express';
const express = require('express');
const path = require("path")
const router = express.Router();
import * as auth from "./auth";
import * as userActions from "./userActions"
import * as adminActions from "./adminActions"



// Base routes

router.get("/", (req: Request,res:Response) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
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
  if (login_result.success){return res.status(200).json({ status: 200, error: login_result.message, token: login_result.token });}
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



export default router;