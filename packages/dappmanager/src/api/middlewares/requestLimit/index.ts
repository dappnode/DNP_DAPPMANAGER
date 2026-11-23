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

/**
 * Stricter per-IP limit for the Nexus login route, which completes an OAuth code
 * exchange against the Nexus backend and stores the resulting API key
 */
export function getNexusAuthLimiter(): express.RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    message: "Too many Nexus login attempts from this IP, please try again later"
  });
}

/**
 * Strict per-IP limit for the routes that check the admin password. Only
 * rejected attempts count, so a successful login or password change never
 * uses up the budget
 */
export function getAuthLimiter(): express.RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    skipSuccessfulRequests: true,
    message: "Too many failed attempts from this IP, please try again later"
  });
}
