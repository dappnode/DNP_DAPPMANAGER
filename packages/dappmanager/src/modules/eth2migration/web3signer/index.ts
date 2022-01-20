import fetch from "node-fetch";
import { Response } from "node-fetch";
import retry from "async-retry";
import { extendError } from "../../../utils/extendError";
import {
  Web3signerImportRequest,
  Web3signerImportResponse,
  Web3signerListResponse
} from "../params";
import { logs } from "../../../logs";

export class Web3Signer {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  // TODO: consider calling /upcheck before every call

  /**
   * API call to web3signer GET /upcheck: https://consensys.github.io/web3signer/web3signer-eth2.html#tag/Server-Status
   * @returns "OK"
   */
  async upcheck(): Promise<string> {
    const endpoint = new URL(`${this.url}/upcheck`);
    const response = await retry(
      async () => {
        return await fetch(endpoint, {
          method: "GET"
        }).catch(e => {
          throw extendError(e, `Error fetching ${endpoint}`);
        });
      },
      { retries: 5 }
    );
    this.handleResponse(response);
    // response body format: text/plain; charset=utf-8
    const status = await response.text().catch(e => {
      throw extendError(e, `Error parsing body response from ${endpoint}`);
    });
    return status.toUpperCase().trim();
  }

  /**
   * API call to web3signer POST /eth/v1/keystores: https://consensys.github.io/web3signer/web3signer-eth2.html#operation/KEYMANAGER_IMPORT
   * @returns
   * ```
   * {
   *    data: [{
   *        status: "imported";
   *        message: "";
   *    },{
   *        status: "error";
   *        message: "";
   *    }]
   * }
   * ```
   */
  async importKeystores(
    importKeystoresPostData: Web3signerImportRequest
  ): Promise<Web3signerImportResponse> {
    const endpoint = new URL(`${this.url}/eth/v1/keystores`);
    logs.info(JSON.stringify(importKeystoresPostData));
    const response = await retry(
      async () => {
        return await fetch(endpoint, {
          method: "POST",
          body: JSON.stringify(importKeystoresPostData),
          headers: { "Content-Type": "application/json" }
        }).catch(e => {
          throw extendError(e, `Error fetching ${endpoint}`);
        });
      },
      { retries: 5 }
    );
    this.handleResponse(response);
    // response body format: application/json
    const body: Web3signerImportResponse = await response.json().catch(e => {
      throw extendError(e, `Error parsing body response from ${endpoint}`);
    });
    return body;
  }

  /**
   * API call to web3signer GET /eth/v1/keystores : https://consensys.github.io/web3signer/web3signer-eth2.html#operation/KEYMANAGER_LIST
   * The API call may result in a PARTIAL SUCCESS: this means there might be successful imports, but some failed.
   * All imports must be successful to proceed.
   * @param response
   * ```
   * {
   *    data: [{
   *        validating_pubkey: "0x93247f2209abcacf57b75a51dafae777f9dd38bc7053d1af526f220a7489a6d3a2753e5f3e8b1cfe39b56f43611df74a";
   *        derivation_path: "m/12381/3600/0/0/0";
   *        readonly: true;
   *    }]
   * }
   * ```
   */
  async listKeystores(): Promise<Web3signerListResponse> {
    const endpoint = new URL(`${this.url}/eth/v1/keystores`);
    const response = await retry(
      async () => {
        return await fetch(endpoint, {
          method: "GET"
        }).catch(e => {
          throw extendError(e, `Error fetching ${endpoint}`);
        });
      },
      { retries: 5 }
    );
    this.handleResponse(response);
    // response body format: application/json
    const body: Web3signerListResponse = await response.json().catch(e => {
      throw extendError(e, `Error parsing body response from ${endpoint}`);
    });
    return body;
  }

  /**
   * handle header error
   */
  private handleResponse(response: Response): void {
    if (!response.ok) {
      throw Error(`${response.status} ${response.statusText}`);
    }
  }
}
