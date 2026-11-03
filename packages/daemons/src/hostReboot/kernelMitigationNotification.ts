import { Category, NotificationPayload, Priority, RebootRequiredScript, Status } from "@dappnode/types";

export const KERNEL_MITIGATION_CORRELATION_ID = "core-cve-2026-98432-mitigation";

/** Report live risk reduction separately from reboot and kernel patch status. */
export function getKernelMitigationNotification(
  mitigation: RebootRequiredScript["kernelSecurityMitigation"],
  dnpName: string,
  previous?: NotificationPayload
): NotificationPayload | undefined {
  if (!mitigation || mitigation === "not-applicable") return undefined;
  if (mitigation === "removed" && previous?.status !== Status.triggered) return undefined;

  const content = {
    mitigated: {
      title: "CVE-2026-98432 temporary mitigation active",
      body: "Temporary network rules reduce exposure but do not fix the kernel vulnerability. Install the official kernel security update when available, then reboot.",
      priority: Priority.medium,
      status: Status.triggered
    },
    failed: {
      title: "CVE-2026-98432 temporary mitigation needs attention",
      body: "The temporary mitigation is incomplete or could not be verified. Review the Core upgrade logs and the security advisory. The kernel vulnerability is not fixed by this mitigation.",
      priority: Priority.high,
      status: Status.triggered
    },
    removed: {
      title: "CVE-2026-98432 temporary mitigation removed",
      body: "The temporary mitigation was removed. This does not verify whether the running kernel contains the security fix.",
      priority: Priority.low,
      status: Status.resolved
    }
  }[mitigation];

  if (previous?.title === content.title && previous.body === content.body && previous.status === content.status) {
    return undefined;
  }
  return {
    ...content,
    dnpName,
    category: Category.system,
    isBanner: true,
    isRemote: mitigation === "failed",
    correlationId: KERNEL_MITIGATION_CORRELATION_ID,
    callToAction: { title: "Host updates", url: "http://my.dappnode/system/host" }
  };
}
