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

export function wrapHandler<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReqParams extends { [key: string]: any } = Record<string, any>
>(handler: express.RequestHandler<ReqParams>): express.RequestHandler<ReqParams> {
  return async (req, res, next): Promise<void> => {
    try {
      await handler(req, res, next);
    } catch (e) {
      if (res.headersSent) {
        next(e);
      } else if (e instanceof HttpError) {
        if (res && res.status) {
          res.status(e.statusCode).send({
            error: { name: e.name, message: e.message }
          });
        } else {
          // TODO: Find a proper way to end the session and redirect the user to a beauty UI
          // End session due to a probably cookie change
          // req.session = null;
        }
      } else {
        res.status(500).send({
          error: { message: e.message, data: e.stack }
        });
      }
    }
  };
}

/**
 * Use this wrapper when user opens its URL directly on the browser
 * Wrap express routes to be able to safely throw errors and return HTML
 * @param handler
 */
export function wrapHandlerHtml<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReqParams extends { [key: string]: any } = Record<string, any>
>(handler: express.RequestHandler<ReqParams>): express.RequestHandler<ReqParams> {
  return async (req, res, next): Promise<void> => {
    try {
      await handler(req, res, next);
    } catch (e) {
      next(e);
    }
  };
}

export function toSocketIoHandler(expressHandler: express.Handler): Parameters<Server["use"]>[0] {
  return function (socket, next): void {
    expressHandler(
      socket.handshake as unknown as express.Request,
      {} as express.Response,
      next as express.NextFunction
    );
  };
}
