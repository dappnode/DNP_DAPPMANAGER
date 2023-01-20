import { startHttpApi } from "../../../src/api/startHttpApi.js";
import fetch, { Response } from "node-fetch";
import http from "http";
import { expect } from "chai";
import { urlJoin } from "../../../src/utils/url.js";
import { io } from "socket.io-client";

interface RequestRes {
  code: number;
  body: string;
}

describe.skip("Test server auth", function () {
  this.timeout(5000);

  const port = 8654;
  const baseUrl = `http://localhost:${port}`;
  let server: http.Server;

  async function parseRes(res: Response): Promise<RequestRes> {
    return {
      code: res.status,
      body: await res.json()
    };
  }

  function expectRes(res: RequestRes, expectedRes: Partial<RequestRes>): void {
    expect(res).to.deep.include(
      expectedRes,
      `Bad res\n${JSON.stringify(res, null, 2)}\n`
    );
  }

  before("start server", () => {
    server = startHttpApi({} as Parameters<typeof startHttpApi>[0]);
  });

  it("Should not be logged", async () => {
    const res = await fetch(urlJoin(baseUrl, "ping"));
    expectRes(await parseRes(res), { code: 400 });
  });

  it("Should reject websocket connection", async () => {
    await new Promise((resolve, reject) => {
      const socket = io(baseUrl);
      socket.on("connect", () => resolve);
      socket.on("connect_error", reject); // Handles server errors
      socket.on("error", reject); // Handles middleware / authentication errors
      socket.on("disconnect", reject); // Handles individual socket errors
    });
  });

  const password = "secret";
  let cookie: string;

  it("Should register", async () => {
    const res = await fetch(urlJoin(baseUrl, "register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    expectRes(await parseRes(res), { code: 200 });
  });

  it("Should login", async () => {
    const res = await fetch(urlJoin(baseUrl, "login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    expectRes(await parseRes(res), { code: 200 });

    // Fetch cookie
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) throw Error("Response must include set-cookie value");
    cookie = setCookie;
  });

  it("Should be logged in", async () => {
    const res = await fetch(urlJoin(baseUrl, "ping"), {
      headers: { cookie }
    });
    expectRes(await parseRes(res), { code: 200 });
  });

  it("Should accept websocket connection", async () => {
    await new Promise((resolve, reject) => {
      const socket = io(baseUrl, {
        // Socket.io is not typing 'extraHeaders' which actually exists
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        extraHeaders: { cookie }
      });
      socket.on("connect", () => resolve);
      socket.on("connect_error", reject); // Handles server errors
      socket.on("error", reject); // Handles middleware / authentication errors
      socket.on("disconnect", reject); // Handles individual socket errors
    });
  });

  after("Stop server", () => {
    server.close();
  });
});
