import { api, useApi } from "api";
import { continueIfCalleDisconnected } from "api/utils";
import { withToast } from "components/toast/Toast";
import { useState, useEffect, useCallback, useRef } from "react";
import { httpsPortalDnpName } from "params";
import { prettyDnpName } from "utils/format";

export function usePwaRequirements() {
  // Requirements
  const pwaRequirementsReq = useApi.pwaRequirementsGet();
  const [pwaMappingUrl, setPwaMappingUrl] = useState<string | null>(null);
  const [httpsDnpInstalled, setHttpsDnpInstalled] = useState<boolean>(false);
  const [installingHttps, setInstallingHttps] = useState<boolean>(false);
  const [isHttpsRunning, setIsHttpsRunning] = useState<boolean>(false);
  const [restartingHttps, setRestartingHttps] = useState<boolean>(false);
  const [requirementsLoading, setRequirementsLoading] = useState<boolean>(true);
  const [isOnPwaDomain, setIsOnPwaDomain] = useState<boolean>(false);
  const hasRestartedRef = useRef(false);

  useEffect(() => {
    if (pwaRequirementsReq.data) {
      const data = pwaRequirementsReq.data;
      setPwaMappingUrl(data.pwaMappingUrl || null);
      setHttpsDnpInstalled(data.httpsDnpInstalled);
      setIsHttpsRunning(data.isHttpsRunning);
    }
  }, [pwaRequirementsReq.data]);

  useEffect(() => {
    setRequirementsLoading(pwaRequirementsReq.isValidating);
  }, [pwaRequirementsReq.isValidating]);

  useEffect(() => {
    const restartHttpsPkg = async () => {
      if (httpsDnpInstalled && !isHttpsRunning && !hasRestartedRef.current) {
        try {
          hasRestartedRef.current = true; // Prevent multiple restarts
          setRestartingHttps(true);
          await api.packageRestart({
            dnpName: httpsPortalDnpName
          });
        } catch (error) {
          console.error(`Error while restarting ${prettyDnpName(httpsPortalDnpName)} package: ${error}`);
        } finally {
          setTimeout(async () => {
            await pwaRequirementsReq.revalidate();
            setRestartingHttps(false);
          }, 5000); // Wait 5 seconds before checking again, since it can take some time for the package to start
        }
      }
    };
    restartHttpsPkg();
  }, [httpsDnpInstalled, isHttpsRunning]);

  useEffect(() => {
    // Check if the user is on a PWA domain
    const currentDomain = window.location.hostname;
    if (pwaMappingUrl && currentDomain === new URL(pwaMappingUrl).hostname) {
      setIsOnPwaDomain(true);
    } else {
      setIsOnPwaDomain(false);
    }
  }, [pwaMappingUrl]);

  const installHttpsPkg = useCallback(async (): Promise<void> => {
    try {
      setInstallingHttps(true);
      await withToast(
        continueIfCalleDisconnected(
          () =>
            api.packageInstall({
              name: httpsPortalDnpName,
              options: {
                BYPASS_CORE_RESTRICTION: true
              }
            }),
          httpsPortalDnpName
        ),
        {
          message: `Installing ${prettyDnpName(httpsPortalDnpName)}...`,
          onSuccess: `Installed ${prettyDnpName(httpsPortalDnpName)}`,
          onError: `Error while installing ${prettyDnpName(httpsPortalDnpName)}`
        }
      );
    } catch (error) {
      console.error(`Error while installing ${prettyDnpName(httpsPortalDnpName)} package: ${error}`);
    } finally {
      setTimeout(async () => {
        await pwaRequirementsReq.revalidate();
        setInstallingHttps(false);
      }, 5000); // Wait 5 seconds before checking again, since it can take some time for the package to start
    }
  }, [httpsDnpInstalled]);

  return {
    requirementsLoading,
    httpsDnpInstalled,
    isHttpsRunning,
    restartingHttps,
    installingHttps,
    installHttpsPkg,
    pwaMappingUrl,
    isOnPwaDomain
  };
}
