import { RequestHandler } from "express";
import fileUpload from "express-fileupload";
import {
  HTTP_UPLOAD_MAX_FILE_SIZE_BYTES,
  HTTP_UPLOAD_MAX_REQUEST_OVERHEAD_BYTES,
  createFileTransferId,
  tempTransferDir,
  uploadResourceGuard
} from "./tempTransfer.js";
import { UploadResourceError } from "./uploadResourceGuard.js";

export const parseHttpUploadFile = fileUpload({
  limits: { fileSize: HTTP_UPLOAD_MAX_FILE_SIZE_BYTES, files: 1, fields: 0, parts: 1 },
  abortOnLimit: true,
  responseOnLimit: `Uploaded file exceeds maximum size of ${HTTP_UPLOAD_MAX_FILE_SIZE_BYTES} bytes`,
  useTempFiles: true,
  tempFileDir: tempTransferDir
});

/**
 * Reserve disk and concurrency capacity before express-fileupload starts
 * streaming a multipart body to disk. Content-Length is required so capacity
 * can be reserved accurately; browser and standard multipart clients set it.
 */
export const reserveHttpUploadCapacity: RequestHandler = (req, res, next): void => {
  const contentLength = parseContentLength(req.headers["content-length"]);
  if (contentLength instanceof UploadResourceError) {
    res.status(contentLength.statusCode).send(contentLength.message);
    return;
  }

  if (contentLength > HTTP_UPLOAD_MAX_FILE_SIZE_BYTES + HTTP_UPLOAD_MAX_REQUEST_OVERHEAD_BYTES) {
    res.status(413).send(`Upload request exceeds maximum size of ${HTTP_UPLOAD_MAX_FILE_SIZE_BYTES} bytes`);
    return;
  }

  // Multipart framing is not written to the temp file. Clamp the reservation
  // to the maximum possible file bytes while retaining a conservative estimate
  // for smaller requests.
  const reservationBytes = Math.min(contentLength, HTTP_UPLOAD_MAX_FILE_SIZE_BYTES);
  const reservationId = `http:${createFileTransferId()}`;

  uploadResourceGuard
    .reserve({ id: reservationId, kind: "http", sizeBytes: reservationBytes })
    .then((reservation) => {
      // The client may disconnect while the asynchronous statfs check runs,
      // before the close listener below can be attached.
      if (req.destroyed || res.destroyed || res.writableEnded) {
        reservation.release();
        return;
      }

      let released = false;
      const release = (): void => {
        if (released) return;
        released = true;
        reservation.release();
      };

      res.once("finish", release);
      res.once("close", release);
      next();
    })
    .catch((err) => {
      if (err instanceof UploadResourceError) {
        res.status(err.statusCode).send(err.message);
        return;
      }
      next(err);
    });
};

function parseContentLength(value: string | undefined): number | UploadResourceError {
  if (value === undefined) {
    return new UploadResourceError("Content-Length is required for uploads", 411);
  }

  const contentLength = Number(value);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    return new UploadResourceError("Content-Length must be a positive integer", 400);
  }
  return contentLength;
}
