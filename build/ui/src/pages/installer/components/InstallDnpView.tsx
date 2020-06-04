import React, { useState, useEffect, useRef } from "react";
import { api } from "api";
import { useDispatch } from "react-redux";
import {
  Switch,
  Route,
  Redirect,
  withRouter,
  RouteComponentProps
} from "react-router-dom";
import { isEmpty, throttle, pick } from "lodash";
import { difference } from "utils/lodashExtended";
import { shortNameCapitalized, isDnpVerified } from "utils/format";
// This module
import { ProgressLogsView } from "./InstallCardComponents/ProgressLogsView";
// Components
import Info from "./Steps/Info";
import { SetupWizard } from "components/SetupWizard";
import Permissions from "./Steps/Permissions";
import Disclaimer from "./Steps/Disclaimer";
import HorizontalStepper from "./HorizontalStepper";
import Card from "components/Card";
import StatusIcon from "components/StatusIcon";
// External
import { rootPath as packagesRootPath } from "pages/packages/data";
import { RequestedDnp, UserSettingsAllDnps, ProgressLogs } from "types";
import { withToast } from "components/toast/Toast";
import { isSetupWizardEmpty } from "../parsers/formDataParser";
import { clearIsInstallingLog } from "services/isInstallingLogs/actions";
import { continueIfCalleDisconnected } from "api/utils";

const BYPASS_CORE_RESTRICTION = "BYPASS_CORE_RESTRICTION";
const SHOW_ADVANCED_EDITOR = "SHOW_ADVANCED_EDITOR";

interface InstallDnpViewProps {
  dnp: RequestedDnp;
  progressLogs?: ProgressLogs;
}

/**
 * [WARNING!] Do NOT store the userSetFormData as it may contain large files,
 * or do it with caution. The size of userSetFormData stringified is not found
 */
// const getUniqueId = dnp =>
//   "dappnode-user-set-form-data-" + dnp.origin ||
//   (dnp.manifest || {}).name + (dnp.manifest || {}).version;

const InstallDnpView: React.FunctionComponent<
  InstallDnpViewProps & RouteComponentProps
> = ({
  dnp,
  progressLogs,
  // Extra
  history,
  location,
  match
}) => {
  const [userSettings, setUserSettings] = useState({} as UserSettingsAllDnps);
  const [options, setOptions] = useState({} as { [optionId: string]: boolean });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const dispatch = useDispatch();

  const { name, reqVersion, settings, metadata, setupWizard } = dnp;
  const isCore = metadata.type === "dncore";
  const permissions = dnp.specialPermissions;
  const requiresCoreUpdate = dnp.request.compatible.requiresCoreUpdate;
  const isWizardEmpty = isSetupWizardEmpty(setupWizard);
  const oldEditorAvailable = Boolean(userSettings);

  useEffect(() => {
    setUserSettings(settings || {});
  }, [settings, setUserSettings]);

  // Here's how we'll keep track of our component's mounted state
  const componentIsMounted = useRef(true);
  useEffect(() => {
    return () => {
      componentIsMounted.current = false;
    };
  }, []); // Using an empty dependency array ensures this only runs on unmount

  const onInstall = async (newData?: {
    newUserSettings: UserSettingsAllDnps;
  }) => {
    // Since React update order is not guaranteed, pass newUserSettings as a
    // parameter if necessary to ensure it has the latest state
    const _userSettings =
      newData && newData.newUserSettings
        ? newData.newUserSettings
        : userSettings;

    const kwargs = {
      name,
      version: reqVersion,
      // Send only relevant data, ignoring settings that are equal to the current
      userSettings: difference(settings || {}, _userSettings),
      // Prevent sending the SHOW_ADVANCED_EDITOR option
      options: pick(options, [BYPASS_CORE_RESTRICTION])
    };

    // Do the process here to control when the installation finishes,
    // and do some nice transition to the package
    console.log("Installing DNP", kwargs);
    try {
      setIsInstalling(true);
      await withToast(
        // If call errors with "callee disconnected", resolve with success
        continueIfCalleDisconnected(() => api.installPackage(kwargs), name),
        {
          message: `Installing ${shortNameCapitalized(name)}...`,
          onSuccess: `Installed ${shortNameCapitalized(name)}`
        }
      );
      // Re-direct user to package page if installation is successful
      if (componentIsMounted.current) {
        setIsInstalling(false);
        setShowSuccess(true);
        setTimeout(() => {
          if (componentIsMounted.current) {
            setShowSuccess(false);
            history.push(packagesRootPath + "/" + name);
          }
        }, 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      dispatch(clearIsInstallingLog({ id: name }));
    }
  };
  // Prevent a burst of install calls
  const onInstallThrottle = throttle(onInstall, 1000);

  const disclaimers: { name: string; message: string }[] = [];
  // Default disclaimer for public DNPs
  if (!isDnpVerified(dnp.name) || dnp.origin)
    disclaimers.push({
      name: "Unverified package",
      message:
        "This package has been developed by a third party. DAppNode association is not maintaining this package and has not performed any audit on its content. Use it at your own risk. DAppNode will not be liable for any loss or damage produced by the use of this package"
    });
  if (metadata.disclaimer)
    disclaimers.push({
      name: shortNameCapitalized(name),
      message: metadata.disclaimer.message
    });

  /**
   * Construct options
   * 1. If package is core and from ipfs, show "BYPASS_CORE_RESTRICTION" option
   */
  const optionsArray = [
    {
      name: "Show advanced editor",
      id: SHOW_ADVANCED_EDITOR,
      available: isWizardEmpty && oldEditorAvailable
    },
    {
      name: "Bypass core restriction",
      id: BYPASS_CORE_RESTRICTION,
      available: dnp.origin && isCore
    }
  ]
    .filter(option => option.available)
    .map(option => ({
      ...option,
      checked: options[option.id],
      toggle: () =>
        setOptions(x => ({ ...x, [option.id]: !options[option.id] }))
    }));

  const disableInstallation = !isEmpty(progressLogs) || requiresCoreUpdate;

  const setupSubPath = "setup";
  const permissionsSubPath = "permissions";
  const disclaimerSubPath = "disclaimer";
  const installSubPath = "install";

  const availableRoutes = [
    {
      name: "Setup",
      subPath: setupSubPath,
      render: () => (
        <SetupWizard
          setupWizard={setupWizard || {}}
          userSettings={userSettings}
          onSubmit={(newUserSettings: UserSettingsAllDnps) => {
            console.log("Set new userSettings", newUserSettings);
            setUserSettings(newUserSettings);
            goNext({ newUserSettings });
          }}
          goBack={goBack}
        />
      ),
      available: !isWizardEmpty || options[SHOW_ADVANCED_EDITOR]
    },
    {
      name: "Permissions",
      subPath: permissionsSubPath,
      render: () => (
        <Permissions
          permissions={permissions}
          onAccept={goNext}
          goBack={goBack}
        />
      ),
      available: permissions.length > 0
    },
    {
      name: "Disclaimer",
      subPath: disclaimerSubPath,
      render: () => (
        <Disclaimer
          disclaimers={disclaimers}
          onAccept={goNext}
          goBack={goBack}
        />
      ),
      available: disclaimers.length > 0
    },
    // Placeholder for the final step in the horizontal stepper
    {
      name: "Install",
      subPath: installSubPath,
      available: true
    }
  ].filter(route => route.available);

  // Compute the route index for the stepper display
  const currentSubRoute =
    (location.pathname || "").split(match.url + "/")[1] || "";
  const currentIndex = availableRoutes.findIndex(
    ({ subPath }) => subPath && currentSubRoute.includes(subPath)
  );

  /**
   * Logic to control which route requires a redirect and when
   * - "install": never okay, redirect to the main page
   * - When the DNP is updated (finish installation), redirect to /packages
   */
  useEffect(() => {
    if (currentSubRoute) history.push(match.url);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  // Do this in a different way
  // useEffect(() => {
  //   if (isQueryDnpUpdated && name) history.push(packagesRootPath + "/" + name);
  // }, [tag, name, isQueryDnpUpdated, history]);

  function goNext(newData?: { newUserSettings: UserSettingsAllDnps }) {
    const nextIndex = currentIndex + 1;
    // When going to the last step "install", redirect to home and install
    if (nextIndex >= availableRoutes.length - 1) {
      // Prevent re-renders and pushing the same route
      if (location.pathname !== match.url) history.push(match.url);
      onInstallThrottle(newData);
    } else {
      const nextStep = availableRoutes[nextIndex];
      if (nextStep) history.push(`${match.url}/${nextStep.subPath}`);
    }
  }

  function goBack() {
    const prevStep = availableRoutes[currentIndex - 1];
    if (prevStep) history.push(`${match.url}/${prevStep.subPath}`);
    else history.push(match.url);
  }

  return (
    <>
      {progressLogs ? (
        <ProgressLogsView progressLogs={progressLogs} />
      ) : showSuccess ? (
        <Card spacing>
          <StatusIcon success={true} message="Successfully installed!" />
        </Card>
      ) : isInstalling ? (
        <ProgressLogsView progressLogs={{ [name]: "..." }} />
      ) : null}

      {requiresCoreUpdate && (
        <div className="alert alert-danger">
          <strong>{shortNameCapitalized(name)}</strong> requires a more recent
          version of DAppNode. <strong>Update your DAppNode</strong> before
          continuing the installation.
        </div>
      )}

      {currentIndex >= 0 && availableRoutes.length > 1 && (
        <HorizontalStepper
          routes={availableRoutes.map(route => route.name)}
          currentIndex={currentIndex}
        />
      )}

      <Switch>
        <Route
          path={match.path}
          exact
          render={() => (
            <Info
              dnp={dnp}
              onInstall={() => goNext()}
              disableInstallation={disableInstallation}
              optionsArray={optionsArray}
            />
          )}
        />
        {availableRoutes
          .filter(route => route.render)
          .map(route => (
            <Route
              key={route.subPath}
              path={`${match.path}/${route.subPath}`}
              render={route.render}
            />
          ))}
        {/* Redirect automatically to the first route. DO NOT hardcode 
                to prevent typos and causing infinite loops */}
        <Redirect to={`${match.url}/${availableRoutes[0].subPath}`} />
      </Switch>
    </>
  );
};

export default withRouter(InstallDnpView);
