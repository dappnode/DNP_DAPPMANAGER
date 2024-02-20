/**
 * Returns a unique domain per container, considering multi-service packages
 * @param dnpName DAppNode package name
 * @param serviceName Service name (optional)
 * @returns Container domain in the format <service-name>.<dappnode-package-name> if service-name is not empty and different from dappnode-package-name, otherwise returns dappnode-package-name
 */
export const getContainerDomain = ({
  dnpName,
  serviceName,
}: {
  serviceName?: string;
  dnpName: string;
}): string => {
  return !serviceName || serviceName === dnpName
    ? dnpName
    : `${serviceName}.${dnpName}`;
};
