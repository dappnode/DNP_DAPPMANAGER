import express from "express";
import * as db from "@dappnode/db";

let counter = 0;

export function getViewsCounterMiddleware(): express.RequestHandler {
  return (req, _, next): void => {
    try {
      // Only count views for the main page and login status
      // Other requests are not from the UI but for other API calls
      if (req.url === "/" || req.url === "/login-status") {
        counter++;
        // Clean the counter every 10 views
        if (counter > 10) {
          const currentViews = db.counterViews.get();
          db.counterViews.set(currentViews + counter);
          counter = 0;
        }
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}
