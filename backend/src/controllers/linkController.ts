import { Request, Response } from 'express';
import { prisma } from '../db';
import * as auth from "../auth";
import crypto from 'crypto';

const { extractToken } = auth;

function generateLinkId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateUniqueLinkId(): Promise<string> {
  let id: string;
  let exists: boolean;
  do {
    id = generateLinkId();
    const existing = await prisma.shared_links.findUnique({
      where: { id }
    });
    exists = !!existing;
  } while (exists);
  return id;
}

export const createSharedLink = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let user_permission = await auth.validateUserToken(token, null);
  if (user_permission.level === "none") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const id = await generateUniqueLinkId();
    const result = await prisma.shared_links.create({
      data: {
        id,
        url,
        user_id: user_permission.user_id as string
      }
    });

    return res.status(200).json({
      id: result.id,
      url: result.url,
      shortUrl: `${req.protocol}://${req.get('host')}/${result.id}`
    });
  } catch (error) {
    console.error("Error creating shared link:", error);
    return res.status(500).json({ error: "Failed to create shared link" });
  }
};

export const getSharedLink = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id.length !== 6) {
    return res.status(400).json({ error: "Invalid link ID" });
  }

  try {
    const link = await prisma.shared_links.findUnique({
      where: { id: id as string }
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    return res.redirect(link.url);
  } catch (error) {
    console.error("Error retrieving shared link:", error);
    return res.status(500).json({ error: "Failed to retrieve link" });
  }
};

export const deleteSharedLink = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let user_permission = await auth.validateUserToken(token, null);
  if (user_permission.level === "none") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    const link = await prisma.shared_links.findUnique({
      where: { id: id as string }
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    // Only the owner or admin can delete
    if (user_permission.level !== "admin" && link.user_id !== user_permission.user_id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.shared_links.delete({
      where: { id: id as string }
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting shared link:", error);
    return res.status(500).json({ error: "Failed to delete link" });
  }
};

export const getUserSharedLinks = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let user_permission = await auth.validateUserToken(token, null);
  if (user_permission.level === "none") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const links = await prisma.shared_links.findMany({
      where: { user_id: user_permission.user_id as string },
      orderBy: { created_at: 'desc' }
    });

    return res.status(200).json(links);
  } catch (error) {
    console.error("Error retrieving user shared links:", error);
    return res.status(500).json({ error: "Failed to retrieve links" });
  }
};

export const getAllSharedLinks = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let user_permission = await auth.validateUserToken(token, null);
  if (user_permission.level !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  try {
    const links = await prisma.shared_links.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: {
            username: true
          }
        }
      }
    });

    return res.status(200).json(links);
  } catch (error) {
    console.error("Error retrieving all shared links:", error);
    return res.status(500).json({ error: "Failed to retrieve links" });
  }
};
