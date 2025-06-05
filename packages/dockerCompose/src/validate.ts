import { getSchemaValidator } from "@dappnode/utils";
import compose3xSchema from "./compose_v3x.schema.json" with { type: "json" };
import { Compose } from "@dappnode/types";

/**
 * Validates a compose 3.x not strictly
 * Official schemas for docker compose https://github.com/docker/cli/tree/master/cli/compose/schema/data
 */
export const validateCompose = getSchemaValidator<Compose>(compose3xSchema);
