import React, { useState, useEffect, useRef } from "react";
import { api, useApi } from "api";
import { useDispatch } from "react-redux";
import { Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { isEmpty, throttle } from "lodash-es";
import { difference } from "utils/lodashExtended";
import { prettyDnpName, isDnpVerified } from "utils/format";
import { diff } from "semver";
import { toast } from "sonner";
// Parsers & helpers
import { isSetupWizardEmpty } from "pages/installer/parsers/formDataParser";
import { clearIsInstallingLog } from "services/isInstallingLogs/actions";
import { continueIfCalleDisconnected } from "api/utils";
// Types
import { ProgressLogs } from "types";
import { RequestedDnp, UserSettingsAllDnps, CustomEndpoint, GatusEndpoint } from "@dappnode/types";
// New components
import { Button } from "components/primitives/button";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { TriangleAlert, ExternalLink } from "lucide-react";
import { InstallerStepper } from "./InstallerStepper";
import { InstallerInfoStep } from "./InstallerInfoStep";
import { InstallerPermissionsStep } from "./InstallerPermissionsStep";
import { InstallerWarningsStep } from "./InstallerWarningsStep";
import { InstallerDisclaimerStep } from "./InstallerDisclaimerStep";
import { InstallerNotificationsStep } from "./InstallerNotificationsStep";
import { InstallerSetupWizard } from "./InstallerSetupWizard";
import { AutoUpdatesDialog, shouldPromptAutoUpdates } from "./AutoUpdatesDialog";
import { pathName as systemPathName, subPaths as systemSubPaths } from "pages/system/data";
import { withLegacyBase } from "utils/path";
import { packagesRelativePath } from "../packages/data";

interface InstallerViewProps {
  dnp: RequestedDnp;
  progressLogs?: ProgressLogs;
}

/**
 * Main installer view — orchestrates the multi-step install flow
 * using the new design system. Mirrors the logic of the legacy
 * `InstallDnpView` but with shadcn/ui primitives.
 */
export function InstallerView({ dnp, progressLogs }: InstallerViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const dispatch = useDispatch();

  const [userSettings, setUserSettings] = useState<UserSettingsAllDnps>({});
  const [bypassCoreOpt, setBypassCoreOpt] = useState<boolean>();
  const [bypassSignedOpt, setBypassSignedOpt] = useState<boolean>();
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  /** Tracks whether we've seen progress logs at least once during this install */
  const hasSeenLogs = useRef(false);
  const [notificationsPkgInstalled, setNotificationsPkgInstalled] = useState(false);
  /** Controls the auto-updates dialog shown after install completion */
  const [autoUpdatesDialogOpen, setAutoUpdatesDialogOpen] = useState(false);

  const {
    dnpName,
    reqVersion,
    semVersion,
    settings,
    manifest,
    setupWizard,
    isInstalled,
    installedVersion,
    notificationsSettings
  } = dnp;

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

  const [endpoints, setEndpoints] = useState<GatusEndpoint[]>(manifest.notifications?.endpoints || []);
  const [customEndpoints, setCustomEndpoints] = useState<CustomEndpoint[]>(
    manifest.notifications?.customEndpoints || []
  );

  const notificationsPkgStatusRequest = useApi.notificationsPackageStatus();

  useEffect(() => {
    if (notificationsPkgStatusRequest.data) {
      setNotificationsPkgInstalled(notificationsPkgStatusRequest.data.isInstalled);
    }
  }, [notificationsPkgStatusRequest.data]);

  useEffect(() => {
    if (notificationsSettings && notificationsSettings[dnpName]) {
      setEndpoints(notificationsSettings[dnpName].endpoints || []);
      setCustomEndpoints(notificationsSettings[dnpName].customEndpoints || []);
    }
  }, [notificationsSettings, dnpName]);

  useEffect(() => {
    setUserSettings(settings || {});
  }, [settings]);

  const componentIsMounted = useRef(true);
  useEffect(() => {
    return () => {
      componentIsMounted.current = false;
    };
  }, []);

  /* ── Install handler ──────────────────────────────────────────── */

  const onInstall = async (newData?: { newUserSettings: UserSettingsAllDnps }) => {
    const _userSettings = newData && newData.newUserSettings ? newData.newUserSettings : userSettings;
    const prettyName = prettyDnpName(dnpName);

    try {
      setIsInstalling(true);
      hasSeenLogs.current = false;
      toast.loading(`Installing ${prettyName}…`, { id: dnpName });

      // continueIfCalleDisconnected returns a function — invoke it with ()
      await continueIfCalleDisconnected(
        () =>
          api.packageInstall({
            name: dnpName,
            version: reqVersion,
            userSettings: difference(settings || {}, _userSettings),
            options: {
              BYPASS_CORE_RESTRICTION: bypassCoreOpt,
              BYPASS_SIGNED_RESTRICTION: bypassSignedOpt
            },
            notificationsSettings: {
              [dnpName]: {
                endpoints: endpoints.length > 0 ? endpoints : undefined,
                customEndpoints: customEndpoints.length > 0 ? customEndpoints : undefined
              }
            }
          }),
        dnpName
      )();

      // NOTE: Do NOT show success or redirect here.
      // continueIfCalleDisconnected resolves immediately when the
      // dappmanager disconnects during install. The actual install is
      // still in progress — tracked via progressLogs from Redux.
      // A useEffect below watches for progressLogs to clear, then
      // fires the success toast and redirects.
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Failed to install ${prettyName}`, {
        id: dnpName,
        description: message
      });
      console.error(e);
      // Only reset on error — success is handled by the effect below
      dispatch(clearIsInstallingLog({ id: dnpName }));
      if (componentIsMounted.current) setIsInstalling(false);
    }
  };

  /* ── Detect install completion via progressLogs ───────────────── */

  useEffect(() => {
    if (!isInstalling) return;

    const hasLogs = progressLogs && !isEmpty(progressLogs);

    // Track that we've seen progress logs at least once
    if (hasLogs) {
      hasSeenLogs.current = true;
    }

    // Install is done: we saw logs before, and now they're gone
    if (hasSeenLogs.current && !hasLogs) {
      const prettyName = prettyDnpName(dnpName);
      toast.success(`${prettyName} installed successfully`, { id: dnpName });

      dispatch(clearIsInstallingLog({ id: dnpName }));
      setIsInstalling(false);
      hasSeenLogs.current = false;

      // Check if we should prompt the auto-updates dialog.
      // If yes → open it (redirect happens when the dialog closes).
      // If no  → redirect to the store after a short delay.
      shouldPromptAutoUpdates(dnpName).then((shouldPrompt) => {
        if (shouldPrompt && componentIsMounted.current) {
          setAutoUpdatesDialogOpen(true);
        } else if (componentIsMounted.current) {
          navigate(`${packagesRelativePath}/${encodeURIComponent(dnpName)}/info`);
        }
      });
    }
  }, [progressLogs, isInstalling, dnpName, dispatch, navigate]);

  const onInstallThrottle = throttle(onInstall, 1000);

  /* ── Disclaimers ──────────────────────────────────────────────── */

  const disclaimers: { name: string; message: string }[] = [];
  if (!isDnpVerified(dnpName) || dnp.origin)
    disclaimers.push({
      name: "Unverified package",
      message:
        "This package has been developed by a third party. DAppNode association is not maintaining this package and has not performed any audit on its content. Use it at your own risk. DAppNode will not be liable for any loss or damage produced by the use of this package"
    });
  if (manifest.disclaimer) disclaimers.push({ name: prettyDnpName(dnpName), message: manifest.disclaimer.message });

  /* ── Advanced options ─────────────────────────────────────────── */

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

  const disableInstallation =
    !isEmpty(progressLogs) || requiresCoreUpdate || requiresDockerUpdate || packagesToBeUninstalled.length > 0;

  /* ── Step routes ──────────────────────────────────────────────── */

  const setupSubPath = "setup";
  const permissionsSubPath = "permissions";
  const warningsSubPath = "warnings";
  const disclaimerSubPath = "disclaimer";
  const notificationsSubPath = "notifications";
  const installSubPath = "install";

  const showNotificationsStep = notificationsPkgInstalled && manifest.notifications;

  const availableRoutes = [
    {
      name: "Setup",
      subPath: setupSubPath,
      render: () => (
        <InstallerSetupWizard
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
      render: () => <InstallerPermissionsStep permissions={permissions} onAccept={goNext} goBack={goBack} />,
      available: hasPermissions
    },
    {
      name: "Warnings",
      subPath: warningsSubPath,
      render: () => (
        <InstallerWarningsStep
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
      render: () => <InstallerDisclaimerStep disclaimers={disclaimers} onAccept={goNext} goBack={goBack} />,
      available: disclaimers.length > 0
    },
    {
      name: "Notifications",
      subPath: notificationsSubPath,
      render: () => (
        <InstallerNotificationsStep
          endpointsGatus={endpoints}
          setEndpointsGatus={setEndpoints}
          endpointsCustom={customEndpoints}
          setEndpointsCustom={setCustomEndpoints}
          goNext={goNext}
          goBack={goBack}
        />
      ),
      available: showNotificationsStep
    },
    {
      name: "Install",
      subPath: installSubPath,
      available: true
    }
  ].filter((route) => route.available);

  const currentSubRoute = location.pathname.split(`${encodeURIComponent(params.id || "")}/`)[1] || "";
  const currentIndex = availableRoutes.findIndex(({ subPath }) => subPath && currentSubRoute.includes(subPath));

  const requiredDockerVersion = manifest.requirements?.minimumDockerVersion;

  /* ── Redirect on mount if sub-route present ───────────────────── */
  useEffect(() => {
    if (currentSubRoute) navigate(".");
  }, []);

  /* ── Navigation ───────────────────────────────────────────────── */

  function goNext(newData?: { newUserSettings: UserSettingsAllDnps }) {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= availableRoutes.length - 1) {
      navigate(".");
      onInstallThrottle(newData);
    } else {
      const nextStep = availableRoutes[nextIndex];
      if (nextStep) navigate(nextStep.subPath);
    }
  }

  function goBack() {
    if (currentIndex <= 0) {
      // At the first step or info page — go back to info page (index route)
      navigate(".");
    } else {
      const prevStep = availableRoutes[currentIndex - 1];
      // Navigate to the previous step's subPath relative to the installer base
      navigate(`../${prevStep.subPath}`);
    }
  }

  /* ── Render ───────────────────────────────────────────────────── */

  return (
    <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y">
      {/* ── Blocking alerts ──────────────────────────────────────── */}
      {(requiresCoreUpdate || requiresDockerUpdate || packagesToBeUninstalled.length > 0) && (
        <div className="tw:flex tw:flex-col tw:gap-3">
          {requiresCoreUpdate && (
            <Alert variant="destructive">
              <TriangleAlert className="tw:size-4" />
              <AlertTitle>Core update required</AlertTitle>
              <AlertDescription>
                <strong>{prettyDnpName(dnpName)}</strong> requires a more recent version of DAppNode. Update your
                DAppNode before continuing.
              </AlertDescription>
            </Alert>
          )}

          {requiresDockerUpdate && (
            <Alert variant="destructive">
              <TriangleAlert className="tw:size-4" />
              <AlertTitle>Docker update required</AlertTitle>
              <AlertDescription className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                <span>
                  <strong>{prettyDnpName(dnpName)}</strong> requires at least Docker{" "}
                  <strong>{requiredDockerVersion}</strong>. Update Docker in <strong>System → Advanced</strong>.
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => navigate(withLegacyBase(`${systemPathName}/${systemSubPaths.advanced}`))}
                >
                  Go to Advanced
                  <ExternalLink className="tw:ml-1 tw:size-3" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {packagesToBeUninstalled.length > 0 && (
            <Alert variant="destructive">
              <TriangleAlert className="tw:size-4" />
              <AlertTitle>Packages must be uninstalled first</AlertTitle>
              <AlertDescription>
                <strong>{prettyDnpName(dnpName)}</strong> requires uninstalling:{" "}
                {packagesToBeUninstalled.map((pkg, i) => (
                  <span key={pkg}>
                    <strong>{prettyDnpName(pkg)}</strong>
                    {i < packagesToBeUninstalled.length - 1 ? ", " : ""}
                  </span>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* ── Stepper (only when in a sub-step) ────────────────────── */}
      {currentIndex >= 0 && availableRoutes.length > 1 && (
        <InstallerStepper steps={availableRoutes.map((r) => r.name)} currentIndex={currentIndex} />
      )}

      {/* ── Step routes ──────────────────────────────────────────── */}
      <Routes>
        <Route
          path="/"
          element={
            <InstallerInfoStep
              dnp={dnp}
              onInstall={() => goNext()}
              disableInstallation={disableInstallation}
              optionsArray={optionsArray}
              progressLogs={progressLogs}
              isInstalling={isInstalling}
            />
          }
        />
        {availableRoutes
          .filter((route) => route.render)
          .map((route) => (
            <Route key={route.subPath} path={route.subPath} element={<>{route.render!()}</>} />
          ))}
      </Routes>

      {/* ── Auto-updates dialog (shown after successful install) ── */}
      <AutoUpdatesDialog
        dnpName={dnpName}
        open={autoUpdatesDialogOpen}
        onOpenChange={(open) => {
          setAutoUpdatesDialogOpen(open);
          // When the dialog closes, redirect to the store
          if (!open && componentIsMounted.current) {
            navigate(`${packagesRelativePath}/${encodeURIComponent(dnpName)}/info`);
          }
        }}
      />
    </div>
  );
}
