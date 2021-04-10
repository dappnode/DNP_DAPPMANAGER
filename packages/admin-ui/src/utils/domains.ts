// ///////////////////////////////////////////////
// Should be in sync with `dappmanager/src/domains
// ///////////////////////////////////////////////

type ContainerNames = { serviceName: string; dnpName: string };

function getContainerDomain({ dnpName, serviceName }: ContainerNames): string {
  if (!serviceName || serviceName === dnpName) {
    return dnpName;
  } else {
    return [serviceName, dnpName].join(".");
  }
}

function shortUniqueDappnodeEns(dnpName: string): string {
  for (const s of [".dnp.dappnode.eth", ".dappnode.eth", ".eth"])
    if (dnpName.endsWith(s)) dnpName = dnpName.slice(0, -s.length);
  return dnpName;
}

export function getPublicSubdomain(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  // eslint-disable-next-line no-useless-escape
  return shortUniqueDappnodeEns(fullEns).replace(/[^a-zA-Z\-]+/g, "-");
}
