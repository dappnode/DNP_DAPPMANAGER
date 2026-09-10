import fs from "fs";

export type UploadKind = "http" | "mcp";

export interface UploadReservation {
  release(): void;
}

export interface UploadResourceGuardOptions {
  directory: string;
  maxConcurrentUploads: number;
  maxReservedBytes: number;
  minFreeBytes: number;
  getAvailableBytes?: (directory: string) => Promise<number>;
}

export class UploadResourceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "UploadResourceError";
  }
}

interface ReservationRecord {
  kind: UploadKind;
  sizeBytes: number;
}

/**
 * Reserves upload capacity before bytes are accepted. Reservations from HTTP
 * and MCP share one guard so neither path can independently exhaust the temp
 * transfer filesystem.
 */
export class UploadResourceGuard {
  private readonly reservations = new Map<string, ReservationRecord>();
  private readonly getAvailableBytes: (directory: string) => Promise<number>;

  constructor(private readonly options: UploadResourceGuardOptions) {
    this.getAvailableBytes = options.getAvailableBytes ?? getFilesystemAvailableBytes;
  }

  async reserve({
    id,
    kind,
    sizeBytes
  }: {
    id: string;
    kind: UploadKind;
    sizeBytes: number;
  }): Promise<UploadReservation> {
    if (!id) throw new UploadResourceError("Upload reservation ID is required", 400);
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
      throw new UploadResourceError("Upload reservation size must be a positive safe integer", 400);
    }
    if (this.reservations.has(id)) throw new UploadResourceError(`Upload reservation ${id} already exists`, 409);

    if (this.reservations.size >= this.options.maxConcurrentUploads) {
      throw new UploadResourceError(`Too many active uploads; maximum is ${this.options.maxConcurrentUploads}`, 429);
    }

    const reservedBytes = this.getReservedBytes();
    if (reservedBytes + sizeBytes > this.options.maxReservedBytes) {
      throw new UploadResourceError(
        `Active uploads would reserve more than ${this.options.maxReservedBytes} bytes`,
        507
      );
    }

    // Add the reservation before the asynchronous disk check. A concurrent
    // reserve call will see it and cannot race past the aggregate limits.
    this.reservations.set(id, { kind, sizeBytes });

    try {
      const availableBytes = await this.getAvailableBytes(this.options.directory);
      const requiredBytes = this.getReservedBytes() + this.options.minFreeBytes;
      if (!Number.isSafeInteger(availableBytes) || availableBytes < 0) {
        throw new UploadResourceError("Could not determine available upload disk space", 507);
      }
      if (availableBytes < requiredBytes) {
        throw new UploadResourceError(
          `Insufficient upload disk space: ${availableBytes} bytes available, ${requiredBytes} bytes required`,
          507
        );
      }
    } catch (err) {
      this.reservations.delete(id);
      if (err instanceof UploadResourceError) throw err;
      throw new UploadResourceError(
        `Could not determine available upload disk space: ${err instanceof Error ? err.message : String(err)}`,
        507
      );
    }

    let released = false;
    return {
      release: () => {
        if (released) return;
        released = true;
        this.reservations.delete(id);
      }
    };
  }

  getActiveCount(): number {
    return this.reservations.size;
  }

  getReservedBytes(): number {
    let total = 0;
    for (const reservation of this.reservations.values()) total += reservation.sizeBytes;
    return total;
  }
}

async function getFilesystemAvailableBytes(directory: string): Promise<number> {
  const stats = await fs.promises.statfs(directory);
  return stats.bavail * stats.bsize;
}
