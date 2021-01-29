import * as db from "../db";
import { LocalIpResponse } from "../types";

export function ipLocalGet(): LocalIpResponse {
    return {
        localIp: db.internalIp.get()
    }
}