import { Request, Response } from 'express';
const path = require("path");

export const serveIndex = (req: Request, res: Response) => {
  const devPath = path.join(__dirname, '../../client/index.html');
  const prodPath = path.join(__dirname, '../public/index.html');
  const fs = require('fs');
  const useDev = process.env.NODE_ENV === 'development' && fs.existsSync(devPath);
  const indexPath = useDev ? devPath : prodPath;
  return res.sendFile(indexPath);
};

export const serveAdmin = async (req: Request, res: Response) => {
  if (!req.cookies.session_token) {return res.redirect("/")}
  const auth = require("../auth");
  let user_permission = await auth.validateUserToken(req.cookies.session_token,"admin");
  if (!user_permission.met){return res.status(401).json({error:"Unauthorized! You must be an admin to see this page!"})}
  const devPath = path.join(__dirname, '../../client/index.html');
  const prodPath = path.join(__dirname, '../public/index.html');
  const fs = require('fs');
  const useDev = process.env.NODE_ENV === 'development' && fs.existsSync(devPath);
  const indexPath = useDev ? devPath : prodPath;
  return res.sendFile(indexPath);
};
