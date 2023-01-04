export * from "./types.js";
export * from "./routes.js";
export * from "./subscriptions.js";
export * from "./transport/jsonRpc/index.js";
export * from "./transport/socketIo/index.js";

// Schemas

// @ts-ignore
import routesArgumentsSchema from "./validation/schemas/routesArguments.schema.js";
// @ts-ignore
import routesReturnSchema from "./validation/schemas/routesReturn.schema.js";
// @ts-ignore
import subscriptionsArgumentsSchema from "./validation/schemas/subscriptionsArguments.schema.js";

export {
  routesArgumentsSchema,
  routesReturnSchema,
  subscriptionsArgumentsSchema,
};
