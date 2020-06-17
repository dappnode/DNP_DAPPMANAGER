import { getValidator } from "../../utils/schema";
import compose3xSchema from "./compose_v3x.schema.json";
import { Compose } from "../../types";

/**
 * Validates a compose 3.x not strictly
 */
export const validateCompose = getValidator<Compose>(compose3xSchema);
