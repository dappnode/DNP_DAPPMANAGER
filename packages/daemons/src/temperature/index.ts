import { eventBus } from "@dappnode/eventbus";
import { params } from "@dappnode/params";
import { runAtMostEvery } from "@dappnode/utils";
import { PackageNotification } from "@dappnode/types";
import si from "systeminformation";

interface TemperatureThreshold extends PackageNotification {
  celsius: number;
}

interface TemperatureRecord {
  lastEmit: number;
  count: number;
}

const thresholds: TemperatureThreshold[] = [
  {
    id: "cpuTemperature-warning",
    type: "warning",
    celsius: 95,
    title: "CPU temperature is too high",
    body: "The CPU temperature has consistently been at a warning level of 95ºC, you can ommit this waring if your dappnode is syncinga blockchain, its temperature should decrease once synced.",
  },
  {
    id: "cpuTemperature-danger",
    type: "danger",
    celsius: 100,
    title: "CPU temperature is too high",
    body: "The CPU temperature is at a dangerous level of 100ºC. An unexpected shutdown might occur.",
  },
];

// Store temperature exceedances
const temperatureRecords: Record<string, TemperatureRecord> = {
  "cpuTemperature-warning": { lastEmit: 0, count: 0 },
  "cpuTemperature-danger": { lastEmit: 0, count: 0 },
};

const HOUR_IN_MS = 3600000; // 60 minutes * 60 seconds * 1000 milliseconds

/**
 * Monitor CPU temperature and emit events based on specified conditions.
 * - If the CPU temperature exceeds 105ºC, emit a danger notification immediately.
 * - If the CPU temperature exceeds 95ºC, emit a warning notification if it has been at that level for 5 times within an hour.
 */
async function monitorCpuTemperature(): Promise<void> {
  const cpuTemperature = await si.cpuTemperature();
  const now = Date.now();

  for (const threshold of thresholds) {
    const record = temperatureRecords[threshold.id];

    // Check if the CPU temperature exceeds the threshold
    if (cpuTemperature.main > threshold.celsius) {
      if (threshold.type === "danger" && now - record.lastEmit > HOUR_IN_MS) {
        // For danger notifications, emit at most once per hour
        emitNotification(threshold);
        record.lastEmit = now;
      } else if (threshold.type === "warning") {
        // Increment count if within an hour for warning
        if (now - record.lastEmit <= HOUR_IN_MS) {
          record.count += 1;
        } else {
          // Reset count and lastEmit if more than an hour has passed
          record.count = 1;
          record.lastEmit = now;
          continue;
        }

        // Emit warning notification at most once per hour when count reaches 8
        if (record.count >= 8 && now - record.lastEmit > HOUR_IN_MS) {
          emitNotification(threshold);
          // Reset count and update lastEmit to prevent multiple notifications within the same hour
          record.count = 0;
          record.lastEmit = now;
        }
      }
    }
  }
}

function emitNotification(threshold: TemperatureThreshold): void {
  eventBus.notification.emit({
    id: threshold.id,
    type: threshold.type,
    title: threshold.title,
    body: threshold.body,
  });
}

/**
 * Temperature daemon.
 * Checks CPU temperature and emit events if it's too high.
 */
export function startTemperatureDaemon(signal: AbortSignal): void {
  runAtMostEvery(
    async () => monitorCpuTemperature(),
    params.TEMPERATURE_DAEMON_INTERVAL,
    signal
  );
}
