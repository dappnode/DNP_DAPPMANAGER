const prefix = "exited (";

/**
 * Parse exit code from container readable status string
 * https://github.com/docker/docker-ce/blob/1208c1600f02fe5bba7bf7687ee95ece6cce1d2a/components/engine/container/state.go#L101
 *
 * Code
 * ```go
 * fmt.Sprintf("Exited (%d) %s ago", s.ExitCodeValue, units.HumanDuration(time.Now().UTC().Sub(s.FinishedAt)))
 * ```
 *
 * Example status
 * ```bash
 * Up 3 weeks
 * Exited (137) 19 hours ago
 * ```
 */
export function parseExitCodeFromStatus(status: string): number | null {
  if (typeof status !== "string" || !status.toLowerCase().startsWith(prefix))
    return null;

  const rest = status.slice(prefix.length);
  const closingParensIndex = rest.indexOf(")");
  if (closingParensIndex <= 0) return null;

  const exitCodeString = rest.slice(0, closingParensIndex);
  const exitCode = parseInt(exitCodeString);

  if (isNaN(exitCode)) return null;

  return exitCode;
}
