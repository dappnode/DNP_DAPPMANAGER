import rateLimit from "express-rate-limit";
import express from "express";

export function getLimiter(): express.RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Limit each IP to 100 requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    message: "Too many requests from this IP, please try again later"
  });
}
