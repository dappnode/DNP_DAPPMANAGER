import { PackageContainer } from "@dappnode/common";

export type SimpleState =
  | "stopped"
  | "crashed"
  | "running"
  | "restarting"
  | "removing";
export type BadgeVariant = "danger" | "success" | "secondary" | "warning";
export type PackageContainerStatus = Pick<
  PackageContainer,
  "state" | "exitCode"
>;

export function parseContainerState(
  container: PackageContainerStatus
): { variant: BadgeVariant; state: SimpleState; title: string } {
  const { state, exitCode } = container;

  switch (state) {
    case "removing":
      return { variant: "secondary", state: "removing", title: "Removing" };
    case "created":
      return { variant: "secondary", state: "stopped", title: "Created" };

    case "paused":
      return { variant: "secondary", state: "stopped", title: "Paused" };

    case "exited":
      // Be conservative, if exitCode could not be parsed assume crashed
      // This only affects visual UI elements, for critical DAPPMANAGER code
      // if exitCode is not known call container.inspect and get the exitCode
      if (exitCode === 0) {
        return { variant: "secondary", state: "stopped", title: "Exited (0)" };
      } else {
        return {
          variant: "danger",
          state: "crashed",
          title: `Exited (${exitCode})`
        };
      }

    case "running":
      return { variant: "success", state: "running", title: "Running" };

    case "restarting":
      return { variant: "warning", state: "restarting", title: "Restarting" };

    case "dead":
      return { variant: "danger", state: "crashed", title: "Dead" };
  }
}

export function allContainersHaveSameVariant(
  containers: PackageContainer[]
): boolean {
  return (
    containers.length <= 1 ||
    containers.every(
      container =>
        parseContainerState(container).variant ===
        parseContainerState(containers[0]).variant
    )
  );
}
