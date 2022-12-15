import { Writable } from "stream";

/**
 * Buffers all stream data in memory, accessible at
 * ```ts
 * instance.chunks
 * ```
 */
export class MemoryWritable<T> extends Writable {
  chunks: T[] = [];

  constructor() {
    super({
      write: (chunk, encoding, cb): void => {
        this.chunks.push(chunk);
        cb();
      }
    });
  }
}
