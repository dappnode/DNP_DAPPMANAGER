import express from "express";
import * as db from "../../db";

let counter = 0;

export function getViewsCounterMiddleware(): express.RequestHandler {
  return (req, res, next): void => {
    try {
      counter++;
      if (counter > 10) {
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
