import { expect } from "chai";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import {
  completeNexusAuth,
  type NexusAuthKeyStore,
  type NexusManagedApiKey
} from "../../../src/api/routes/nexusAuth.js";

const issuer = "https://nexus-auth.dappnode.com";
const clientId = "986265c5bcad52f7";
const nonce = "test-nonce";
const input = {
  action: "login",
  clientId,
  code: "authorization-code",
  codeVerifier: "v".repeat(64),
  nonce,
  redirectUri: "http://my.dappnode/nexus/auth/callback"
} as const;

let privateKey: CryptoKey;
let jwks: JWTVerifyGetKey;

describe("nexus auth", () => {
  before(async () => {
    const keyPair = await generateKeyPair("RS256");
    privateKey = keyPair.privateKey;
    const publicJwk = await exportJWK(keyPair.publicKey);
    jwks = createLocalJWKSet({ keys: [{ ...publicJwk, alg: "RS256", kid: "test-key", use: "sig" }] });
  });

  it("verifies the ID token, creates a key, and records its owner", async () => {
    const { fetchImpl, calls } = installFetchResponses([
      jsonResponse({ access_token: "access-token", id_token: await makeIdToken(), refresh_token: "refresh-token" }),
      jsonResponse({ sub: "user-id", email: "user@example.com" }),
      jsonResponse({ id: "key-id", raw_key: "sk-created" }),
      new Response(null, { status: 200 })
    ]);
    const state = makeKeyStore();

    const result = await completeNexusAuth(input, state.store, { fetch: fetchImpl, jwks });

    expect(result).to.deep.equal({
      status: {
        configured: true,
        keySource: "nexus",
        accountLabel: "user@example.com"
      },
      accountLabel: "user@example.com"
    });
    expect(state.rawKey).to.equal("sk-created");
    expect(state.managedApiKey).to.deep.equal({
      id: "key-id",
      accountSub: "user-id",
      accountLabel: "user@example.com"
    });
    expect(calls.map(({ method }) => method)).to.deep.equal(["POST", "GET", "POST", "POST"]);
    expect(calls.at(-1)?.url).to.equal("https://nexus-auth.dappnode.com/oauth2/revoke");
  });

  it("rotates the previous managed key instead of accumulating keys", async () => {
    const previous = { id: "old-key", accountSub: "user-id", accountLabel: "old@example.com" };
    const state = makeKeyStore("sk-old", previous);
    const { fetchImpl, calls } = installFetchResponses([
      jsonResponse({ access_token: "access-token", id_token: await makeIdToken() }),
      jsonResponse({ sub: "user-id", email: "new@example.com" }),
      jsonResponse({ id: "new-key", raw_key: "sk-new" }),
      new Response(null, { status: 204 })
    ]);

    await completeNexusAuth(input, state.store, { fetch: fetchImpl, jwks });

    expect(state.rawKey).to.equal("sk-new");
    expect(state.managedApiKey?.id).to.equal("new-key");
    expect(calls.at(-1)).to.deep.include({
      url: "https://nexus-cp.dappnode.com/user/apikeys/old-key",
      method: "DELETE"
    });
  });

  it("revokes the new key and restores the previous key when local persistence fails", async () => {
    const previous = { id: "old-key", accountSub: "user-id", accountLabel: "user@example.com" };
    const state = makeKeyStore("sk-old", previous, async () => {
      throw new Error("local save failed");
    });
    const { fetchImpl, calls } = installFetchResponses([
      jsonResponse({ access_token: "access-token", id_token: await makeIdToken() }),
      jsonResponse({ sub: "user-id" }),
      jsonResponse({ id: "new-key", raw_key: "sk-new" }),
      new Response(null, { status: 204 })
    ]);

    let failure: unknown;
    try {
      await completeNexusAuth(input, state.store, { fetch: fetchImpl, jwks });
    } catch (err) {
      failure = err;
    }

    expect((failure as Error).message).to.equal("local save failed");
    expect(state.rawKey).to.equal("sk-old");
    expect(state.managedApiKey).to.deep.equal(previous);
    expect(calls.at(-1)).to.deep.include({
      url: "https://nexus-cp.dappnode.com/user/apikeys/new-key",
      method: "DELETE"
    });
  });

  it("reauthenticates before revoking a managed key on disconnect", async () => {
    const managed = { id: "managed-key", accountSub: "user-id", accountLabel: "user@example.com" };
    const state = makeKeyStore("sk-managed", managed);
    const { fetchImpl, calls } = installFetchResponses([
      jsonResponse({ access_token: "access-token", id_token: await makeIdToken() }),
      new Response(null, { status: 204 })
    ]);

    const result = await completeNexusAuth({ ...input, action: "disconnect" }, state.store, { fetch: fetchImpl, jwks });

    expect(result.status).to.deep.equal({ configured: false, keySource: "none", accountLabel: null });
    expect(state.rawKey).to.equal("");
    expect(state.managedApiKey).to.equal(null);
    expect(calls.at(-1)).to.deep.include({
      url: "https://nexus-cp.dappnode.com/user/apikeys/managed-key",
      method: "DELETE"
    });
  });

  it("rejects an ID token with an invalid signature before creating a key", async () => {
    const token = await makeIdToken();
    const [header, payload, signature] = token.split(".");
    const tamperedToken = `${header}.${payload}.${signature.startsWith("a") ? "b" : "a"}${signature.slice(1)}`;
    const { fetchImpl, calls } = installFetchResponses([
      jsonResponse({ access_token: "access-token", id_token: tamperedToken })
    ]);
    const state = makeKeyStore();

    let failure: unknown;
    try {
      await completeNexusAuth(input, state.store, { fetch: fetchImpl, jwks });
    } catch (err) {
      failure = err;
    }

    expect((failure as Error).message).to.equal("Nexus login returned an invalid ID token.");
    expect(calls).to.have.length(1);
    expect(state.rawKey).to.equal("");
  });
});

function makeKeyStore(
  initialRawKey = "",
  initialManagedApiKey: NexusManagedApiKey | null = null,
  saveApiKey?: (rawKey: string) => Promise<void>
): {
  readonly rawKey: string;
  readonly managedApiKey: NexusManagedApiKey | null;
  store: NexusAuthKeyStore<{ configured: boolean; keySource: string; accountLabel: string | null }>;
} {
  let rawKey = initialRawKey;
  let managedApiKey = initialManagedApiKey;
  return {
    get rawKey() {
      return rawKey;
    },
    get managedApiKey() {
      return managedApiKey;
    },
    store: {
      getApiKey: () => rawKey,
      saveApiKey: async (nextRawKey) => {
        if (saveApiKey) await saveApiKey(nextRawKey);
        rawKey = nextRawKey;
      },
      restoreApiKey: (nextRawKey) => {
        rawKey = nextRawKey;
      },
      clearApiKey: () => {
        rawKey = "";
      },
      readStatus: () => ({
        configured: Boolean(rawKey),
        keySource: rawKey ? (managedApiKey ? "nexus" : "manual") : "none",
        accountLabel: rawKey ? (managedApiKey?.accountLabel ?? null) : null
      }),
      getManagedApiKey: () => managedApiKey,
      setManagedApiKey: (value) => {
        managedApiKey = value;
      }
    }
  };
}

function installFetchResponses(responses: Response[]): {
  fetchImpl: typeof fetch;
  calls: Array<{ url: string; method: string }>;
} {
  const calls: Array<{ url: string; method: string }> = [];
  const fetchImpl: typeof fetch = async (fetchInput, init) => {
    calls.push({
      url:
        typeof fetchInput === "string"
          ? fetchInput
          : fetchInput instanceof URL
            ? fetchInput.toString()
            : fetchInput.url,
      method: init?.method || "GET"
    });
    const response = responses.shift();
    if (!response) throw new Error("Unexpected fetch call");
    return response;
  };
  return { fetchImpl, calls };
}

async function makeIdToken(): Promise<string> {
  return new SignJWT({ nonce, email: "token@example.com" })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(issuer)
    .setAudience(clientId)
    .setSubject("user-id")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
