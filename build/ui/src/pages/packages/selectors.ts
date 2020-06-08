import { createSelector } from "reselect";
import { getDnpInstalled } from "services/dnpInstalled/selectors";

// pages > packages

// #### EXTERNAL

export const getPackages = getDnpInstalled;

interface OwnPropsPackageRoute {
  match?: {
    path?: string;
    params?: {
      id?: string;
    };
  };
}

// pathname = /packages/kovan.dnp.dappnode.eth
// pathname = /system/kovan.dnp.dappnode.eth
// ownProps = {
//   match: {
//     isExact: true,
//     params: { id: "kovan.dnp.dappnode.eth" },
//     path: "/packages/:id"
//   }
// };
export const getUrlId = createSelector(
  (_: any, ownProps: OwnPropsPackageRoute) =>
    ((ownProps.match || {}).params || {}).id,
  id => id
);

export const areThereDnps = createSelector(
  getDnpInstalled,
  dnps => Boolean((dnps || []).length)
);

// Package lists
export const getFilteredPackages = createSelector(
  getDnpInstalled,
  _packages => _packages.filter(p => p.name !== "core.dnp.dappnode.eth")
);
export const getCorePackages = createSelector(
  getDnpInstalled,
  _packages => _packages.filter(p => p.isCore)
);
export const getDnpPackages = createSelector(
  getDnpInstalled,
  _packages => _packages.filter(p => p.isDnp)
);
export const getDnp = createSelector(
  getUrlId,
  getDnpInstalled,
  (id, dnps) => dnps.find(dnp => dnp.name === id)
);
export const getDnpById = createSelector(
  getDnpInstalled,
  (_: any, id: string) => id,
  (dnps, id) => dnps.find(dnp => dnp.name === id)
);
