import {shellHost, shell} from "@dappnode/utils";

/**
 * Returns uptime of the host
 */
export async function getHostUptime(): Promise<String> {
    try{
        const output = await shellHost("uptime -- -p");
        return output;
    }catch(error){
        console.log("Error getting uptime of the host");
        throw error;
    }
}