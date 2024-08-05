import { CliError } from "./error.js";
import fs from "fs";
import { exec } from "child_process";

/**
 * Validates compose file with docker-compose config
 * @param compose
 */
export async function validateComposeSchema(composePaths: string[]): Promise<void> {

  if (composePaths.length < 1)
    throw Error(`No compose files provided`);

  composePaths.forEach((composePath) => {
    if (!fs.existsSync(composePath))
      throw Error(`Compose file ${composePath} not found`);
  });

  return new Promise((resolve, reject) => {
    exec(
      `docker compose -f ${composePaths.join(" -f ")} config`,
      (error, _stdout, stderr) => {
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
