import express from "express";
import { logs } from "../../logs";
import * as db from "../../db";

let counter = 0;

export function getViewsCounterMiddleware(): express.RequestHandler {
  return (req, res, next): void => {
    try {
      logs.info("counter view");
      counter++;
      if (counter > 10) {
        logs.info(`Total views: ${counter}`);
        const currentViews = db.counterViews.get();
        db.counterViews.set(currentViews + counter);
        counter = 0;
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}
