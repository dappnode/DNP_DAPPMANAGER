import Ajv from "ajv";
import routesArgumentsSchema from "../schemas/RoutesArguments.schema.json";
import routesReturnSchema from "../schemas/RoutesReturn.schema.json";
import subscriptionsArgumentsSchema from "../schemas/SubscriptionsArguments.schema.json";
import { Args } from "../transport/types";

const ajv = new Ajv({ allErrors: true });

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export function validateRoutesArgsFactory() {
  const validate = ajv.compile(routesArgumentsSchema);
  return function validateRoutesArgs(route: string, args: Args): void {
    const valid = validate({ [route]: args });
    if (!valid) throw Error(formatErrors(validate.errors, "routeArgs"));
  };
}

export function validateRoutesReturn(route: string, returnData: any): void {
  const validate = ajv.compile(routesReturnSchema);
  const valid = validate({ [route]: returnData });
  if (!valid) throw Error(formatErrors(validate.errors, "routeReturn"));
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export function validateSubscriptionsArgsFactory() {
  const validate = ajv.compile(subscriptionsArgumentsSchema);
  return function validateSubscriptionsArgs(route: string, args: Args): void {
    const valid = validate({ [route]: args });
    if (!valid) throw Error(formatErrors(validate.errors, "subscriptionArgs"));
  };
}

function formatErrors(
  errors: Array<Ajv.ErrorObject> | null | undefined,
  dataVar: string
): string {
  return (
    "Validation error:\n" + ajv.errorsText(errors, { separator: "\n", dataVar })
  );
}
