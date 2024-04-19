import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { shellHost } from "@dappnode/utils";
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
    logs.info("Determining is Dappnode AWS");
    // see command https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-add-user-data.html#instancedata-user-data-retrieval
    const command = `TOKEN=\`curl -m 10 -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"\` \\
&& curl -m 10 -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/user-data`;

    const userData = await shellHost(command);
    const [userId, botToken] = userData.split(",");

    if (!isValidTelegramUserId(userId) || !isValidTelegramToken(botToken)) {
      logs.error("Invalid aws user data format or content, got: ", userData);
      db.isDappnodeAws.set(false);
      return;
    }

    logs.info(`Dappnode AWS cloud detected for user ID: ${userId}`);

    // store the data in the db
    db.telegramUserId.set(userId);
    db.telegramToken.set(botToken);
    db.telegramStatus.set(true);
    db.isDappnodeAws.set(true);
    // emit event to trigger telegram bot daemon
    eventBus.telegramStatusChanged.emit();
  } catch (error) {
    logs.info("Not a Dappnode AWS cloud");
    db.isDappnodeAws.set(false);
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
