import { getDnpFromIp } from "./sign.js";
import { eventBus } from "@dappnode/eventbus";
import { HttpError, wrapHandler } from "../utils.js";

/**
 * Receive arbitrary notifications from packages to be shown in the UI
 */
export const notificationSend = wrapHandler(async (req, res) => {
  const type = req.query.type;
  const title = req.query.title; // "Some notification"
  const body = req.query.body; // "Some text about notification"

  try {
    if (typeof type === undefined) throw Error("missing");
    if (typeof type !== "string") throw Error("must be a string");
    if (type !== ("danger" || "warning" || "success" || "info"))
      throw Error("must be danger, warning, success or info");
  } catch (e) {
    throw new HttpError({ statusCode: 400, name: `Arg type ${e.message}` });
  }

  try {
    if (typeof title === undefined) throw Error("missing");
    if (typeof title !== "string") throw Error("must be a string");
    if (!title) throw Error("must not be empty");
  } catch (e) {
    throw new HttpError({ statusCode: 400, name: `Arg title ${e.message}` });
  }

  try {
    if (typeof body === undefined) throw Error("missing");
    if (typeof body !== "string") throw Error("must be a string");
    if (!body) throw Error("must not be empty");
  } catch (e) {
    throw new HttpError({ statusCode: 400, name: `Arg body ${e.message}` });
  }

  if (!req.ip) throw new HttpError({ statusCode: 400, name: "Missing IP" });
  const { dnpName } = await getDnpFromIp(req.ip);

  eventBus.notification.emit({
    id: `notification-${dnpName}`,
    type,
    title,
    body
  });

  return res.status(200).send();
});
