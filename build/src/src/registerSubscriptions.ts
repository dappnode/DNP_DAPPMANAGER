import autobahn from "autobahn";
import { getValidator } from "./utils/schemaValidation";
// Subscriptions
import * as autoUpdateData from "./route-types/subscriptionAutoUpdateData";
import * as chainData from "./route-types/subscriptionChainData";
import * as directory from "./route-types/subscriptionDirectory";
import * as packages from "./route-types/subscriptionPackages";
import * as progressLog from "./route-types/subscriptionProgressLog";
import * as pushNotification from "./route-types/subscriptionPushNotification";
import * as userActionLog from "./route-types/subscriptionUserActionLog";
import * as userActionToDappm from "./route-types/subscriptionVpnLegacy";
import * as volumes from "./route-types/subscriptionVolumes";

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export function registerSubscriptions(
  session: autobahn.Session,
  errorLogger: {
    error: (errorMessage: string) => void;
    debug: (errorMessage: string) => void;
  }
) {
  function publish<T>(event: string, arg: T): void {
    // session.publish(topic, args, kwargs, options)
    session.publish(event, [], { data: arg });
  }

  function subscribe<T>(event: string, listener: (arg: T) => void): void {
    // session.subscribe(topic, function(args, kwargs, details) )
    session.subscribe(event, ([dataFromArgs], { dataFromKwargs }) => {
      try {
        listener(dataFromArgs || dataFromKwargs);
      } catch (e) {
        errorLogger.error(`Error on WAMP ${event}: ${e.stack}`);
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
      ? getValidator<T>(dataSchema, "data", errorLogger.debug)
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
          // autobahn returns a wierd error
          const errorMessage =
            typeof e === "object" ? (e.stack ? e.stack : JSON.stringify(e)) : e;
          errorLogger.error(`Error on WAMP emit ${route}: ${errorMessage}`);
        }
      }
    };
  }

  return {
    autoUpdateData: wampBusFactory<autoUpdateData.ReturnData>(autoUpdateData),
    chainData: wampBusFactory<chainData.ReturnData>(chainData),
    directory: wampBusFactory<directory.ReturnData>(directory),
    packages: wampBusFactory<packages.ReturnData>(packages),
    progressLog: wampBusFactory<progressLog.ReturnData>(progressLog),
    pushNotification: wampBusFactory<pushNotification.ReturnData>(
      pushNotification
    ),
    userActionLog: wampBusFactory<userActionLog.ReturnData>(userActionLog),
    volumes: wampBusFactory<volumes.ReturnData>(volumes),
    // Legacy
    logUserActionToDappmanager: wampBusFactory<userActionToDappm.ReturnData>(
      userActionToDappm
    )
  };
}
