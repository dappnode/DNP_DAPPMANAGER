import express from "express";

export interface SessionsHandler {
  handler: express.RequestHandler;
  makeAdmin(req: express.Request): void;
  isAdmin(req: express.Request): boolean;
  destroy(req: express.Request): Promise<void>;
  getId(req: express.Request): string;
}
