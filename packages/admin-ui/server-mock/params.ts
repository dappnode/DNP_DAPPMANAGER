const params = {
  CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  CONTAINER_CORE_NAME_PREFIX: "DAppNodeCore-"
};

/**
 * Get a unique domain per container, considering multi-service packages
 */
export const getContainerDomain = ({
  dnpName,
  serviceName
}: {
  serviceName: string;
  dnpName: string;
}): string => {
  if (!serviceName || serviceName === dnpName) {
    return dnpName;
  } else {
    return [serviceName, dnpName].join(".");
  }
};

export const getImageTag = ({
  dnpName,
  serviceName,
  version
}: {
  dnpName: string;
  serviceName: string;
  version: string;
}): string => [getContainerDomain({ dnpName, serviceName }), version].join(":");

export const getContainerName = ({
  dnpName,
  serviceName,
  isCore
}: {
  dnpName: string;
  serviceName: string;
  isCore: boolean;
}): string =>
  // Note: _PREFIX variables already end with the character "-"
  [
    isCore ? params.CONTAINER_CORE_NAME_PREFIX : params.CONTAINER_NAME_PREFIX,
    getContainerDomain({ dnpName, serviceName })
  ].join("");
