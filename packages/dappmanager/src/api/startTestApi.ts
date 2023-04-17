import * as api from "../calls/index.js";
import http from "http";
import express from "express";
import bodyParser from "body-parser";
import params from "../params.js";
import { logs } from "../logs.js";

export function startTestApi(): http.Server {
  const app = express();
  const server = new http.Server(app);
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Middleware to parse arrays in string format
  app.use((req, res, next) => {
    if (req.query) {
      for (const key in req.query) {
        const value = req.query[key];
        if (typeof value === "string") {
          try {
            req.query[key] = JSON.parse(value);
          } catch (e) {
            // Do nothing
          }
        }
      }
    }
    next();
  });

  logs.info("Test API CALLS:");
  for (const call in api) {
    const callCasted = call as keyof typeof api;
    const callFn = api[callCasted];

    if (typeof callFn === "function") {
      if (callFn.length > 0) {
        app.post(`/${callCasted}`, (req, res) => {
          callFn(req.body as never)
            .then(data => res.send(data))
            .catch(e => res.status(500).send(e.message));
        });
      } else {
        app.get(`/${callCasted}`, (req, res) => {
          callFn(req.query as never)
            .then(data => res.send(data))
            .catch(e => res.status(500).send(e.message));
        });
      }
    }
  }

  // Health check
  app.get("/ping", (req, res) => {
    res.send("OK");
  });

  app.use((req, res) => {
    res.status(404).send("Not found");
  });

  server.listen(params.TEST_API_PORT, () => {
    logs.info(`TEST API ${params.TEST_API_PORT}`);
  });
  return server;
}
