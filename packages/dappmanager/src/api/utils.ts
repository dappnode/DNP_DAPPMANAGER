import express from "express";
import { Server } from "socket.io";

export class HttpError extends Error {
  name: string;
  statusCode: number;
  constructor({ name, statusCode }: { name: string; statusCode?: number }) {
    super(name);
    this.name = name;
    this.statusCode = statusCode || 500;
  }
}

/**
 * Wrap express routes to be able to safely throw errors and return JSON
 * @param handler
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapHandler<ReqParams extends { [key: string]: any } = {}>(
  handler: express.RequestHandler<ReqParams>
): express.RequestHandler<ReqParams> {
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
    res.status(err.statusCode).send({
      error: { name: err.name, message: err.message }
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
