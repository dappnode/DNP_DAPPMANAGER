import fetch from "node-fetch";
import Ajv from "ajv";
import querystring from "querystring";
import { urlJoin } from "@dappnode/utils";

const ajv = new Ajv({ allErrors: true });

interface HttpPortalEntry {
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
}

const httpsPortalResponseSchema = {
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
  async add({ fromSubdomain, toHost }: HttpPortalEntry): Promise<void> {
    const search = querystring.encode({
      from: fromSubdomain,
      to: toHost,
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
    const entries = await this.get<{ from: string; to: string }[]>(
      urlJoin(this.baseUrl, `/?format=json`)
    );

    if (!ajv.validate(httpsPortalResponseSchema, entries)) {
      throw Error(`Invalid response: ${JSON.stringify(ajv.errors, null, 2)}`);
    }

    return entries.map((entry) => ({
      fromSubdomain: entry.from,
      toHost: entry.to,
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
}
