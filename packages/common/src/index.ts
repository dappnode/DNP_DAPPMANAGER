export * from "./transport/jsonRpc/index.js";
export * from "./transport/socketIo/index.js";

// Schemas
// @ts-expect-error expected error until schemas are gnerated
export { default as routesArgumentsSchema } from "./validation/schemas/routesArguments.schema.js";
// @ts-expect-error expected error until schemas are gnerated
export { default as routesReturnSchema } from "./validation/schemas/routesReturn.schema.js";
// @ts-expect-error expected error until schemas are gnerated
export { default as subscriptionsArgumentsSchema } from "./validation/schemas/subscriptionsArguments.schema.js";
