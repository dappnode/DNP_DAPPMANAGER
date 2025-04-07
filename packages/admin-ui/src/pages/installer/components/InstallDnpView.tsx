import React, { useState, useEffect, useRef } from "react";
import { api, useApi } from "api";
import { useDispatch } from "react-redux";
import { Routes, Route, useNavigate, useLocation, useParams, NavLink } from "react-router-dom";
import { isEmpty, throttle } from "lodash-es";
import { difference } from "utils/lodashExtended";
import { prettyDnpName, isDnpVerified } from "utils/format";
// This module
import { ProgressLogsView } from "./InstallCardComponents/ProgressLogsView";
// Components
import { InstallerStepInfo } from "./Steps/Info";
import { SetupWizard } from "components/SetupWizard";
import Permissions from "./Steps/Permissions";
import Disclaimer from "./Steps/Disclaimer";
import HorizontalStepper from "./HorizontalStepper";
import Card from "components/Card";
import StatusIcon from "components/StatusIcon";
// External
import { relativePath as packagesRelativePath } from "pages/packages/data";
import { ProgressLogs } from "types";
import { withToast } from "components/toast/Toast";
import { isSetupWizardEmpty } from "../parsers/formDataParser";
import { clearIsInstallingLog } from "services/isInstallingLogs/actions";
import { continueIfCalleDisconnected } from "api/utils";
import { enableAutoUpdatesForPackageWithConfirm } from "pages/system/components/AutoUpdates";
import Warnings from "./Steps/Warnings";
import { CustomEndpoint, GatusEndpoint, RequestedDnp, UserSettingsAllDnps } from "@dappnode/types";
import { diff } from "semver";
import Button from "components/Button";
import { pathName as systemPathName, subPaths as systemSubPaths } from "pages/system/data";
import { Notifications } from "./Steps/Notifications";
import { notificationsPkgName } from "params";

interface InstallDnpViewProps {
  dnp: RequestedDnp;
  progressLogs?: ProgressLogs;
}

/**
 * [WARNING!] Do NOT store the userSetFormData as it may contain large files,
 * or do it with caution. The size of userSetFormData stringified is not found
 */

const InstallDnpView: React.FC<InstallDnpViewProps> = ({ dnp, progressLogs }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [userSettings, setUserSettings] = useState({} as UserSettingsAllDnps);
  const [bypassCoreOpt, setBypassCoreOpt] = useState<boolean>();
  const [bypassSignedOpt, setBypassSignedOpt] = useState<boolean>();

  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const dispatch = useDispatch();

  const { dnpName, reqVersion, semVersion, settings, manifest, setupWizard, isInstalled, installedVersion } = dnp;
  const updateType = installedVersion && diff(installedVersion, semVersion);
  const areUpdateWarnings =
    manifest.warnings?.onPatchUpdate || manifest.warnings?.onMinorUpdate || manifest.warnings?.onMajorUpdate;
  const isCore = manifest.type === "dncore";
  const permissions = dnp.specialPermissions;
  const hasPermissions = Object.values(permissions).some((p) => p.length > 0);
  const requiresCoreUpdate = dnp.compatible.requiresCoreUpdate;
  const requiresDockerUpdate = dnp.compatible.requiresDockerUpdate;
  const packagesToBeUninstalled = dnp.compatible.packagesToBeUninstalled;
  const isWizardEmpty = isSetupWizardEmpty(setupWizard);
  const oldEditorAvailable = Boolean(userSettings);

  const [endpoints, setEndpoints] = React.useState<GatusEndpoint[]>(manifest.notifications?.endpoints || []);

  const [customEndpoints, setCustomEndpoints] = React.useState<CustomEndpoint[]>(
    manifest.notifications?.customEndpoints || []
  );

  const mergedNotificationsConfig = useApi.notificationsApplyPreviousEndpoints({
    dnpName: dnpName,
    isCore,
    newNotificationsConfig: manifest.notifications || {}
  });

  useEffect(() => {
    if (mergedNotificationsConfig.data) {
      const { endpoints: newEndpoints, customEndpoints: newCustomEndpoints } = mergedNotificationsConfig.data;
      setEndpoints(newEndpoints || []);
      setCustomEndpoints(newCustomEndpoints || []);
    }
  }, [mergedNotificationsConfig.data]);

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

  const onInstall = async (newData?: { newUserSettings: UserSettingsAllDnps }) => {
    // Since React update order is not guaranteed, pass newUserSettings as a
    // parameter if necessary to ensure it has the latest state
    const _userSettings = newData && newData.newUserSettings ? newData.newUserSettings : userSettings;

    // Do the process here to control when the installation finishes,
    // and do some nice transition to the package
    try {
      setIsInstalling(true);
      await withToast(
        // If call errors with "callee disconnected", resolve with success
        continueIfCalleDisconnected(
          () =>
            api.packageInstall({
              name: dnpName,
              version: reqVersion,
              // Send only relevant data, ignoring settings that are equal to the current
              userSettings: difference(settings || {}, _userSettings),
              options: {
                BYPASS_CORE_RESTRICTION: bypassCoreOpt,
                BYPASS_SIGNED_RESTRICTION: bypassSignedOpt
              }
            }),
          dnpName
        ),
        {
          message: `Installing ${prettyDnpName(dnpName)}...`,
          onSuccess: `Installed ${prettyDnpName(dnpName)}`
        }
      );

      // Re-direct user to package page if installation is successful
      if (componentIsMounted.current) {
        setShowSuccess(true);

        await setNotifications();

        setTimeout(() => {
          if (componentIsMounted.current) {
            setShowSuccess(false);
            navigate("/" + packagesRelativePath + "/" + dnpName + "/info");
          }
        }, 1000);
      }

      enableAutoUpdatesForPackageWithConfirm(dnpName).catch((e) => {
        console.error("Error on enableAutoUpdatesForPackageWithConfirm", e);
      });
    } catch (e) {
      console.error(e);
    } finally {
      dispatch(clearIsInstallingLog({ id: dnpName }));
      if (componentIsMounted.current) setIsInstalling(false);
    }
  };
  // Prevent a burst of install calls
  const onInstallThrottle = throttle(onInstall, 1000);

  const setNotifications = async () => {
    if (!manifest.notifications) return;

    if (endpoints.length > 0 || customEndpoints.length > 0) {
      await api.notificationsUpdateEndpoints({
        dnpName,
        notificationsConfig: {
          endpoints: endpoints.length > 0 ? endpoints : undefined,
          customEndpoints: customEndpoints.length > 0 ? customEndpoints : undefined
        },
        isCore
      });
    }
  };

  const disclaimers: { name: string; message: string }[] = [];
  // Default disclaimer for public DNPs
  if (!isDnpVerified(dnpName) || dnp.origin)
    disclaimers.push({
      name: "Unverified package",
      message:
        "This package has been developed by a third party. DAppNode association is not maintaining this package and has not performed any audit on its content. Use it at your own risk. DAppNode will not be liable for any loss or damage produced by the use of this package"
    });
  if (manifest.disclaimer)
    disclaimers.push({
      name: prettyDnpName(dnpName),
      message: manifest.disclaimer.message
    });

  /**
   * Construct options
   * 1. If package is core and from ipfs, show "BYPASS_CORE_RESTRICTION" option
   */
  const optionsArray = [
    {
      name: "Show advanced editor",
      available: isWizardEmpty && oldEditorAvailable,
      checked: showAdvancedEditor,
      toggle: () => setShowAdvancedEditor((x) => !x)
    },
    {
      name: "Bypass core restriction",
      available: dnp.origin && isCore,
      checked: bypassCoreOpt ?? false,
      toggle: () => setBypassCoreOpt((x) => !x)
    },
    {
      name: "Bypass only signed safe restriction",
      available: !dnp.signedSafeAll,
      checked: bypassSignedOpt ?? false,
      toggle: () => setBypassSignedOpt((x) => !x)
    }
  ].filter((option) => option.available);

  const dnpsRequest = useApi.packagesGet();
  const installedDnps = dnpsRequest.data;
  const isNotificationsPkgInstalled = installedDnps?.some((dnp) => dnp.dnpName === notificationsPkgName);

  const disableInstallation =
    !isEmpty(progressLogs) || requiresCoreUpdate || requiresDockerUpdate || packagesToBeUninstalled.length > 0;

  const setupSubPath = "setup";
  const permissionsSubPath = "permissions";
  const warningsSubPath = "warnings";
  const disclaimerSubPath = "disclaimer";
  const notificationsSubPath = "notifications";
  const installSubPath = "install";

  // Only display notifications step if the notifications package is installed && there are endpoints in manifest
  const showNotificationsStep = isNotificationsPkgInstalled && manifest.notifications;

  const availableRoutes: {
    name: string;
    subPath: string;
    render?: (() => React.ReactNode) | undefined;
  }[] = [
    {
      name: "Setup",
      subPath: setupSubPath,
      render: () => (
        <SetupWizard
          setupWizard={setupWizard || {}}
          userSettings={userSettings}
          onSubmit={(newUserSettings: UserSettingsAllDnps) => {
            setUserSettings(newUserSettings);
            goNext({ newUserSettings });
          }}
          goBack={goBack}
        />
      ),
      available: !isWizardEmpty || showAdvancedEditor
    },
    {
      name: "Permissions",
      subPath: permissionsSubPath,
      render: () => <Permissions permissions={permissions} onAccept={goNext} goBack={goBack} />,
      available: hasPermissions
    },
    {
      name: "Warnings",
      subPath: warningsSubPath,
      render: () => (
        <Warnings
          goNext={goNext}
          goBack={goBack}
          warnings={manifest.warnings || {}}
          isInstalled={isInstalled}
          updateType={updateType}
        />
      ),
      available: manifest.warnings?.onInstall || (areUpdateWarnings && isInstalled && updateType)
    },
    {
      name: "Disclaimer",
      subPath: disclaimerSubPath,
      render: () => <Disclaimer disclaimers={disclaimers} onAccept={goNext} goBack={goBack} />,
      available: disclaimers.length > 0
    },
    {
      name: "Notifications",
      subPath: notificationsSubPath,
      render: () => (
        <Notifications
          endpointsGatus={endpoints}
          endpointsCustom={customEndpoints}
          setEndpointsGatus={setEndpoints}
          setEndpointsCustom={setCustomEndpoints}
          goNext={goNext}
          goBack={goBack}
        />
      ),
      available: showNotificationsStep
    },
    // Placeholder for the final step in the horizontal stepper
    {
      name: "Install",
      subPath: installSubPath,
      available: true
    }
  ].filter((route) => route.available);

  // Compute the route index for the stepper display
  const currentSubRoute = location.pathname.split(`${encodeURIComponent(params.id || "")}/`)[1] || "";
  const currentIndex = availableRoutes.findIndex(({ subPath }) => subPath && currentSubRoute.includes(subPath));

  const requiredDockerVersion = manifest.requirements?.minimumDockerVersion;

  /**
   * Logic to control which route requires a redirect and when
   * - "install": never okay, redirect to the main page
   * - When the DNP is updated (finish installation), redirect to /packages
   */
  useEffect(() => {
    if (currentSubRoute) navigate(".");
  }, []);

  // Do this in a different way
  // useEffect(() => {
  //   if (isQueryDnpUpdated && name) history.push(packagesRootPath + "/" + name);
  // }, [tag, name, isQueryDnpUpdated, history]);

  function goNext(newData?: { newUserSettings: UserSettingsAllDnps }) {
    const nextIndex = currentIndex + 1;
    // When going to the last step "install", redirect to home and install
    if (nextIndex >= availableRoutes.length - 1) {
      // This navigates to the current route. Modify it according to your setup.
      navigate(".");
      onInstallThrottle(newData);
    } else {
      const nextStep = availableRoutes[nextIndex];
      if (nextStep) navigate(nextStep.subPath);
    }
  }

  function goBack() {
    const prevStep = availableRoutes[currentIndex - 1];
    if (prevStep) navigate(`../${encodeURIComponent(params.id || "")}/${prevStep.subPath}`);
    else navigate("..");
  }

  return (
    <>
      {progressLogs ? (
        <Card noscroll>
          <ProgressLogsView progressLogs={progressLogs} />
        </Card>
      ) : showSuccess ? (
        <Card spacing>
          <StatusIcon success={true} message="Successfully installed!" />
        </Card>
      ) : isInstalling ? (
        <Card noscroll>
          <ProgressLogsView progressLogs={{ [dnpName]: "Sending request..." }} />
        </Card>
      ) : null}

      {requiresCoreUpdate && (
        <div className="alert alert-danger">
          <strong>{prettyDnpName(dnpName)}</strong> requires a more recent version of DAppNode.{" "}
          <strong>Update your DAppNode</strong> before continuing the installation.
        </div>
      )}

      {requiresDockerUpdate && (
        <div
          className="alert alert-danger"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <strong>{prettyDnpName(dnpName)}</strong> requires at least the
            <strong>{requiredDockerVersion}</strong> version of Docker. <strong>Update your DAppNode</strong> before
            continuing the installation. You can do it with our update Docker button in{" "}
            <strong> System / Advanced</strong> tab.
          </div>
          <NavLink to={"/" + systemPathName + "/" + systemSubPaths.advanced}>
            <Button variant="danger">{"Navigate there"}</Button>
          </NavLink>
        </div>
      )}

      {packagesToBeUninstalled.length > 0 && (
        <div className="alert alert-danger">
          <strong>{prettyDnpName(dnpName)}</strong> requires the following packages to be uninstalled:{" "}
          {packagesToBeUninstalled.map((pkg, i) => (
            <span key={pkg}>
              <strong>{pkg}</strong>
              {i < packagesToBeUninstalled.length - 1 ? ", " : ""}
            </span>
          ))}{" "}
          <strong>Uninstall them</strong> before continuing the installation.
        </div>
      )}

      {currentIndex >= 0 && availableRoutes.length > 1 && (
        <HorizontalStepper routes={availableRoutes.map((route) => route.name)} currentIndex={currentIndex} />
      )}

      <Routes>
        <Route
          path={"/"}
          element={
            <InstallerStepInfo
              dnp={dnp}
              onInstall={() => goNext()}
              disableInstallation={disableInstallation}
              optionsArray={optionsArray}
            />
          }
        />
        {availableRoutes
          .filter((route) => route.render)
          .map((route) => (
            <Route key={route.subPath} path={route.subPath} element={<>{route.render && route.render()}</>} />
          ))}
      </Routes>
    </>
  );
};

export default InstallDnpView;
