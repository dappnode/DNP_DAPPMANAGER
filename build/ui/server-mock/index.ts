import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import * as methods from "./methods";
import { getRpcHandler } from "../src/common/transport/jsonRpc";
import { LoggerMiddleware } from "../src/common/transport/types";

const port = process.env.PORT || 5000;
const whitelist = ["http://localhost:3000", "http://localhost:3001"];

const loggerMiddleware: LoggerMiddleware = {
  onCall: (route, args) => console.log("RPC request", route, args),
  onSuccess: (route, result) => console.log("RPC result", route, result),
  onError: (route, error) => console.log("RPC error", route, error)
};
const rpcHandler = getRpcHandler(methods, loggerMiddleware);

const app = express();

// CORS config follows https://stackoverflow.com/questions/50614397/value-of-the-access-control-allow-origin-header-in-the-response-must-not-be-th
app.use(cors({ credentials: true, origin: whitelist }));
app.use(bodyParser.json());

// Ping / hello endpoint
app.get("/", (req, res) => res.send("Mock server"));

// Rest of RPC methods
app.post("/rpc", (req, res) => {
  rpcHandler(req.body)
    .then(rpcResult => res.send(rpcResult))
    .catch(e =>
      res.status(500).send({ error: { message: e.message, data: e.stack } })
    );
});

app.listen(port, () => {
  /* eslint-disable-next-line no-console */
  console.warn(`Mock app listening http://localhost:${port}`);
});
