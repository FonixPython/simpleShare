import { Request, Response } from 'express';

let isUpdating = false;
let updateMessage = '';

export const getUpdateStatus = (req: Request, res: Response) => {
  res.json({
    isUpdating,
    message: updateMessage
  });
};

export const setUpdatingStatus = (req: Request, res: Response) => {
  const { updating, message } = req.body;
  
  isUpdating = updating || false;
  updateMessage = message || '';
  
  res.json({
    success: true,
    isUpdating,
    message: updateMessage
  });
};
