import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { eventBus } from "@dappnode/eventbus";

/**
 * Determine weather or not is a dappnode AWS by fetching instance user data
 * The user should have introduce a key-value pair in the user data like:
 * - <USER_ID>,<BOT_TOKEN>
 * The data speciffied by the user is stored at amazon server and is only accesible by the instance itself
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-add-user-data.html
 */
export async function determineIsDappnodeAws(): Promise<void> {
  // skip of already migrated
  if (db.isDappnodeAws.get() !== null) return;

  try {
    const token = await fetchWithTimeout(
      "http://169.254.169.254/latest/api/token",
      {
        method: "PUT",
        headers: {
          "X-aws-ec2-metadata-token-ttl-seconds": "21600",
        },
      }
    );

    const userData = await fetchWithTimeout(
      "http://169.254.169.254/latest/user-data",
      {
        headers: {
          "X-aws-ec2-metadata-token": token,
        },
      }
    );

    const [userId, botToken] = userData.split(",");

    if (!isValidTelegramUserId(userId) || !isValidTelegramToken(botToken))
      throw new Error("Invalid user data format or content");

    logs.info(`Dappnode AWS cloud detected for user ID: ${userId}`);

    // store the data in the db
    db.telegramUserId.set(userId);
    db.telegramToken.set(botToken);
    db.telegramStatus.set(true);
    db.isDappnodeAws.set(true);
    // emit event to trigger telegram bot daemon
    eventBus.telegramStatusChanged.emit();
  } catch (error) {
    logs.error("Error determining Dappnode status", error);
    db.isDappnodeAws.set(false);
  }
}

/**
 * Implements fetch with a timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 10000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return await response.text();
  } catch (error) {
    logs.error(`Fetch request failed: ${error.message}`);
    throw error;
  }
}

function isValidTelegramUserId(userId: string): boolean {
  const userIdRegex = /^\d{1,10}$/;
  return userIdRegex.test(userId);
}

function isValidTelegramToken(token: string): boolean {
  const tokenRegex = /^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$/;
  return tokenRegex.test(token);
}
