import { PackageContainer } from "types";

export type SimpleState = "stopped" | "crashed" | "running";
export type BadgeVariant = "danger" | "success" | "secondary";

export function parseContainerState(
  container: PackageContainer
): { variant: BadgeVariant; state: SimpleState; title: string } {
  const { state, exitCode } = container;

  switch (state) {
    case "created":
      return { variant: "secondary", state: "stopped", title: "Created" };

    case "paused":
      return { variant: "secondary", state: "stopped", title: "Paused" };

    case "exited":
      // Be conservative, if exitCode could not be parsed assume crashed
      // NO, call container.inspect if state == exited and exitCode == null
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
      return { variant: "success", state: "running", title: "Restarting" };

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
