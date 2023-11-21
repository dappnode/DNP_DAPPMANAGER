import { CliError } from "./error.js";
import fs from "fs";
import { exec } from "child_process";

/**
 * Validates compose file with docker-compose config
 * @param compose
 */
export async function validateComposeSchema(
  composeFilePath: string
): Promise<void> {
  if (!fs.existsSync(composeFilePath))
    throw Error(`Compose file ${composeFilePath} not found`);

  return new Promise((resolve, reject) => {
    exec(
      `docker-compose -f ${composeFilePath} config`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(new CliError(`Invalid compose:\n${stderr}`));
        } else {
          console.log("Compose file is valid.");
          resolve();
        }
      }
    );
  });
}
