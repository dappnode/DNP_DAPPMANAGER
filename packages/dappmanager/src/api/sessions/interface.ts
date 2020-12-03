import express from "express";

export interface SessionData {
  isAdmin: boolean;
  adminId: string;
}

export interface SessionsManager {
  handler: express.RequestHandler;
  setSession(req: express.Request, data: SessionData): void;
  getSession(req: express.Request): SessionData | null;
  destroy(req: express.Request): Promise<void>;
  getId(req: express.Request): string;
}
