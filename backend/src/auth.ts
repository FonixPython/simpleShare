import { isEmptyBindingElement, PollingWatchKind } from "typescript";
import { Request, Response, NextFunction } from 'express';
import { prisma } from "./db";
import bcrypt from "bcrypt";
import "dotenv/config";
import { callWithErrorHandling } from "vue";

export type PermissionLevel = "admin" | "user" | "none"
export interface PermissionResponse {
    user_id: string | null;
    level: PermissionLevel;
    met: boolean;
}
export interface LoginResponse {
    token: string | null;
    success: boolean;
    message: string;
}


export async function validateUserToken(token:string, validateTo:PermissionLevel | null): Promise<PermissionResponse> {
    try {
        try {
            const token_result = await prisma.session_tokens.findFirstOrThrow({where:{token:token}})
            let user_id:string = token_result.user_id;

            if (token_result.is_valid === false) {return {user_id: user_id,level:"none",met:false}}
            try{
                const user_result = await prisma.users.findFirstOrThrow({where:{id: user_id}})
                const permission: PermissionLevel = user_result.is_admin ? "admin" : "user";
            
                if (validateTo === null) {
                    return {user_id:user_id, level:permission,met:false}
                } else {
                    return {user_id:user_id, level:permission,met:validateTo===permission}
                }
            } catch {return {user_id: null,level:"none",met:false}}
        } catch {
            return {user_id: null,level:"none",met:false}
        }
        
    }catch(err) {
        console.error(err);
        return { user_id: null, level: "none", met: false };
    }   
}

export async function generateSession(user_id:string,user_agent:string | null): Promise<string | null>{
    try {
        const chars:string =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let token:string = "";
        for (let i:number = 0; i < chars.length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));}
        let agent_text:string = ""
        if (user_agent !== null){agent_text=user_agent}
        let result = await prisma.session_tokens.create({data:{token:token,user_id:user_id,user_agent:agent_text}})
        return token;
    } catch(err){
        console.log(err)
        return null;
    }
}


export async function loginUser(username:string,password:string,user_agent:string | null): Promise<LoginResponse> {
    try{
        const user_result = await prisma.users.findUniqueOrThrow({where:{username:username}})
        const isMatch = await bcrypt.compare(password, user_result.password_hash);
        if (isMatch){
            let new_token: string | null = await generateSession(user_result.id,user_agent)
            if (new_token === null) {return {token:null,success:false,message:"Failed to generate token!"}}
            else {return {token:new_token, success:true,message:"Success"}}
        } else{
            return {token:null,success:false,message:"Invalid credentials!"}
        }
    }
    catch(err){
        return {token:null,success:false,message:"User does not exist!"}
    }

}

export async function logoutUser(token:string): Promise<boolean>{
    try {
        await prisma.session_tokens.delete({where:{token:token}})
        return true;
    } catch{
        return false;
    }
}

export async function checkUser(username:string) {
    try {
        const result = await prisma.users.findFirstOrThrow({where:{username:username}})
        return true
    } catch{return false}
}

interface extension {
    [key: string]: any;
}

export async function authenticateUser(req:Request & Record<string, any> , res:Response, next:NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);
  let user_permission = await validateUserToken(auth,null);
  if (user_permission.level === "none") {return res.sendStatus(401);}
  req.user = { id: user_permission.user_id };
  next();
}
