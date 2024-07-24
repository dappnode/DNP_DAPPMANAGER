import Ajv from "ajv";
import crypto from "crypto";
import querystring from "querystring";
import { urlJoin } from "@dappnode/utils";

const ajv = new Ajv({ allErrors: true });

export interface HttpPortalEntry {
  /**
   * The public subdomain
   * `"validator-prysm"`, `"customsubdomain"`
   * Note that there is a max length for domains, and must not use special characters
   */
  fromSubdomain: string;
  /**
   *  The internal resource to target
   * `"validator-prysm"`, `"internal-docker-dns-based-host"`
   */
  toHost: string;
  /**
   * Optional auth credentials for mapping with basic auth
   */
  auth?: {
    username: string;
    password: string;
  };
}

export const httpsPortalResponseSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["from", "to"],
    properties: {
      from: { type: "string" },
      to: { type: "string" },
    },
  },
};

export class HttpsPortalApiClient {
  baseUrl: string;

  /**
   * @param baseUrl "http://172.33.0.6:5000"
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Add a record entry to the https-portal NGINX
   *
   * TODO: Validate characers and uniqueness
   *
   * Example query below results in
   * ```
   * validator-prysm.1ba499fcc3aff025.dyndns.dappnode.io -> validator-prysm
   * ```
   *
   * GET /add?from=<chosen-subodomain>&to=<internal-resource>
   * Empty reply
   */
  async add({ fromSubdomain, toHost, auth }: HttpPortalEntry): Promise<void> {
    const search = querystring.encode({
      from: fromSubdomain,
      to: toHost,
      auth: auth && (await this.getHtpasswdEntry(auth)),
    });
    await this.get(urlJoin(this.baseUrl, `/add?${search}`));
  }

  /**
   * Removes a record entry from the https-portal NGINX
   * @see add
   *
   * GET /remove?from=<chosen-subodomain>&to=<internal-resource>
   * Empty reply
   */
  async remove({ fromSubdomain, toHost }: HttpPortalEntry): Promise<void> {
    const search = querystring.encode({
      from: fromSubdomain,
      to: toHost,
    });
    await this.get(urlJoin(this.baseUrl, `/remove?${search}`));
  }

  /**
   * List existing record entries in the https-portal NGINX
   *
   * GET /?format=json
   * [{"from":"validator-prysm-pyrmont.1ba499fcc3aff025.dyndns.dappnode.io","to":"validator-prysm-pyrmont"}]
   */
  async list(): Promise<HttpPortalEntry[]> {
    const entries = await this.get<
      { from: string; to: string; auth?: string }[]
    >(urlJoin(this.baseUrl, `/?format=json`));

    if (!ajv.validate(httpsPortalResponseSchema, entries)) {
      throw Error(`Invalid response: ${JSON.stringify(ajv.errors, null, 2)}`);
    }

    return entries.map((entry) => ({
      fromSubdomain: entry.from,
      toHost: entry.to,
      auth: entry.auth
        ? {
            username: entry.auth.split(":")[0],
            password: entry.auth.split(":")[1],
          }
        : undefined,
    }));
  }

  private async get<T>(url: string): Promise<T> {
    const res = await fetch(url, { method: "GET" });
    const body = await res.text();

    if (!res.ok) {
      throw Error(`${res.status} ${res.statusText} ${body}`);
    }

    try {
      return JSON.parse(body);
    } catch (e) {
      throw Error(`Error parsing JSON ${e.message}\n${body}`);
    }
  }

  /**
   * Generates an htpasswd entry for a given username and password using the {SSHA} scheme.
   * This entry can be used for HTTP Basic Authentication in NGINX.
   *
   * The {SSHA} scheme uses the SHA-1 hashing algorithm combined with a salt for added security.
   * The salt helps to protect against dictionary and rainbow table attacks by ensuring that even
   * identical passwords will have different hashes if different salts are used.
   *
   * @see https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html
   * @param {string} params.username - The username.
   * @param {string} params.password - The password.
   * @returns {Promise<string>}`exampleUser:{SSHA}5ZCbZYs5Pn5T6Z9wXV5YWZRp+mgc0e3cLQFklHQbU3W5bg==`.
   */
  private async getHtpasswdEntry({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<string> {
    const saltLength = 16; // Length of the salt in bytes

    // Generate a random salt
    const salt = crypto.randomBytes(saltLength);

    // Hash the password using SHA-1 with the salt
    const sha1Hasher = crypto.createHash("sha1");
    sha1Hasher.update(password);
    sha1Hasher.update(salt);
    const hash = sha1Hasher.digest();

    // Combine the hash and salt, then encode in Base64
    const combined = Buffer.concat([hash, salt]).toString("base64");

    // Format the htpasswd entry with the {SSHA} scheme
    return `${username}:{SSHA}${combined}`;
  }
}
