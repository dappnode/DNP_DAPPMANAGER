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

  logs.info("Test API CALLS:");
  for (const call in api) {
    const callCasted = call as unknown as keyof typeof api;
    const callFn = api[callCasted];

    if (typeof callFn === "function") {
      app.get(`/${callCasted}`, (req, res) => {
        logs.info(`Test API call: ${callCasted}`);
        callFn(req.query as never)
          .then(result => {
            res.send(result);
          })
          .catch(e => {
            logs.error(`Test API ERROR in ${callCasted}: ${e}`);
            res.status(500).send(e);
          });
      });
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
