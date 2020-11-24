import express from "express";
import { Server } from "socket.io";

export class HttpError extends Error {
  code: number;
  constructor(message?: string, code?: number) {
    super(message);
    this.code = code || 500;
  }
}

/**
 * Wrap express routes to be able to safely throw errors and return JSON
 * @param handler
 */
export function wrapHandler(
  handler: express.RequestHandler
): express.RequestHandler {
  return async (req, res, next): Promise<void> => {
    try {
      await handler(req, res, next);
    } catch (e) {
      next(e);
    }
  };
}

export const errorHandler: express.ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof HttpError) {
    res.status(err.code).send({
      error: { message: err.message }
    });
  } else {
    res.status(500).send({
      error: { message: err.message, data: err.stack }
    });
  }
};

export function toSocketIoHandler(
  expressHandler: express.Handler
): Parameters<Server["use"]>[0] {
  return function(socket, next): void {
    expressHandler(
      (socket.handshake as unknown) as express.Request,
      {} as express.Response,
      next
    );
  };
}
