import { getValidator } from "../../utils/schema";
import compose3xSchema from "./compose_v3x.schema.json" assert { type: "json" };
import { Compose } from "@dappnode/dappnodesdk";

/**
 * Validates a compose 3.x not strictly
 * Official schemas for docker compose https://github.com/docker/cli/tree/master/cli/compose/schema/data
 */
export const validateCompose = getValidator<Compose>(compose3xSchema);
