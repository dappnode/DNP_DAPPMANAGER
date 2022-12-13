import tar from "tar-stream";
import { promisify } from "util";
import { Writable, pipeline } from "stream";

/**
 * Extracts a single file from a tar stream and pipes its contents
 * to a Writable stream
 */
export async function tarExtractSingleFile(
  tarReadableStream: NodeJS.ReadableStream,
  fileContentSink: Writable,
  targetFile: string
): Promise<void> {
  const extract = tar.extract();

  return new Promise((resolve, reject) => {
    let fileFound = false;

    extract.on("entry", async function (header, stream, next) {
      if (!fileFound && header.name === targetFile && header.type === "file") {
        fileFound = true;

        try {
          await promisify(pipeline)(stream, fileContentSink);
        } catch (e) {
          extract.destroy();
          reject(e);
        } finally {
          next();
        }
      } else {
        // just auto drain the stream, to prevent too much backpressure
        stream.on("end", () => next());
        stream.resume();
      }
    });

    extract.on("finish", function () {
      if (fileFound) resolve();
      else reject(Error(`file ${targetFile} not found in tar`));
    });

    extract.on("error", e => reject(e));

    tarReadableStream.pipe(extract);
  });
}
