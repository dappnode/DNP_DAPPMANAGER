import { expect } from "chai";
import { UploadResourceError, UploadResourceGuard } from "../../../src/uploads/uploadResourceGuard.js";

describe("upload resource guard", () => {
  it("enforces the shared concurrent upload limit and releases capacity idempotently", async () => {
    const guard = createGuard({ maxConcurrentUploads: 2 });
    const first = await guard.reserve({ id: "first", kind: "http", sizeBytes: 10 });
    const second = await guard.reserve({ id: "second", kind: "mcp", sizeBytes: 10 });

    await expectUploadError(guard.reserve({ id: "third", kind: "mcp", sizeBytes: 10 }), 429, "Too many active uploads");

    first.release();
    first.release();
    const third = await guard.reserve({ id: "third", kind: "mcp", sizeBytes: 10 });

    expect(guard.getActiveCount()).to.equal(2);
    second.release();
    third.release();
    expect(guard.getActiveCount()).to.equal(0);
  });

  it("enforces the aggregate reservation limit", async () => {
    const guard = createGuard({ maxReservedBytes: 100 });
    const first = await guard.reserve({ id: "first", kind: "http", sizeBytes: 60 });

    await expectUploadError(guard.reserve({ id: "second", kind: "mcp", sizeBytes: 41 }), 507, "more than 100 bytes");

    expect(guard.getReservedBytes()).to.equal(60);
    first.release();
  });

  it("preserves the configured free disk reserve", async () => {
    const guard = createGuard({ minFreeBytes: 50, getAvailableBytes: async () => 150 });
    const exactFit = await guard.reserve({ id: "exact", kind: "mcp", sizeBytes: 100 });
    exactFit.release();

    await expectUploadError(
      guard.reserve({ id: "too-large", kind: "http", sizeBytes: 101 }),
      507,
      "Insufficient upload disk space"
    );
    expect(guard.getActiveCount()).to.equal(0);
  });

  it("fails closed and releases the reservation when the disk probe fails", async () => {
    const guard = createGuard({
      getAvailableBytes: async () => {
        throw new Error("statfs failed");
      }
    });

    await expectUploadError(guard.reserve({ id: "probe-error", kind: "mcp", sizeBytes: 10 }), 507, "statfs failed");
    expect(guard.getActiveCount()).to.equal(0);
  });
});

function createGuard(
  overrides: Partial<ConstructorParameters<typeof UploadResourceGuard>[0]> = {}
): UploadResourceGuard {
  return new UploadResourceGuard({
    directory: ".",
    maxConcurrentUploads: 10,
    maxReservedBytes: 1_000,
    minFreeBytes: 0,
    getAvailableBytes: async () => 10_000,
    ...overrides
  });
}

async function expectUploadError(promise: Promise<unknown>, statusCode: number, message: string): Promise<void> {
  try {
    await promise;
    throw new Error("Expected upload resource error");
  } catch (err) {
    expect(err).to.be.instanceOf(UploadResourceError);
    expect((err as UploadResourceError).statusCode).to.equal(statusCode);
    expect((err as Error).message).to.include(message);
  }
}
