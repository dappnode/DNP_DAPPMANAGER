import autobahn from "autobahn";
import { getValidator } from "./utils/schemaValidation";
import Logs from "./logs";
const logs = Logs(module);
// Subscriptions
import * as autoUpdateData from "./route-types/subscriptionAutoUpdateData";
import * as chainData from "./route-types/subscriptionChainData";
import * as progressLog from "./route-types/subscriptionProgressLog";
import * as userActionLog from "./route-types/subscriptionUserActionLog";
import * as packages from "./route-types/subscriptionPackages";
import * as pushNotification from "./route-types/subscriptionPushNotification";
import * as userActionToDappm from "./route-types/subscriptionVpnLegacy";

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export function registerSubscriptions(
  session: autobahn.Session,
  errorHandler: (errorMessage: string) => void
) {
  function publish<T>(event: string, arg: T): void {
    // session.publish(topic, args, kwargs, options)
    session.publish(event, [], { data: arg });
  }

  function subscribe<T>(event: string, listener: (arg: T) => void): void {
    // session.subscribe(topic, function(args, kwargs, details) )
    session.subscribe(event, (_0, { data }) => {
      try {
        listener(data);
      } catch (e) {
        errorHandler(`Error on WAMP ${event}: ${e.stack}`);
      }
    });
  }

  /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
  function wampBusFactory<T>({
    route,
    returnDataSchema: dataSchema
  }: {
    route: string;
    returnDataSchema?: object;
  }) {
    const validateData = dataSchema
      ? getValidator<T>(dataSchema, "data", msg => logs.error(msg))
      : null;

    return {
      on: (listener: (arg: T) => void): void => {
        subscribe<T>(route, data => {
          listener(validateData ? validateData(data) : data);
        });
      },
      emit: (data: T): void => {
        try {
          publish(route, validateData ? validateData(data) : data);
        } catch (e) {
          logs.error(`Error on WAMP emit ${route}: ${e.stack}`);
        }
      }
    };
  }

  return {
    autoUpdateData: wampBusFactory<autoUpdateData.ReturnData>(autoUpdateData),
    chainData: wampBusFactory<chainData.ReturnData>(chainData),
    progressLog: wampBusFactory<progressLog.ReturnData>(progressLog),
    userActionLog: wampBusFactory<userActionLog.ReturnData>(userActionLog),
    packages: wampBusFactory<packages.ReturnData>(packages),
    pushNotification: wampBusFactory<pushNotification.ReturnData>(
      pushNotification
    ),
    // Legacy
    logUserActionToDappmanager: wampBusFactory<userActionToDappm.ReturnData>(
      userActionToDappm
    )
  };
}
