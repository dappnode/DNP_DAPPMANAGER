import { wrapHandlerHtml } from "../utils.js";
import { dockerInfoArchive } from "../../modules/docker/index.js";
import {
  dockerGetFileOrDirBasedOnExtension,
  dockerGetPathType
} from "../../modules/docker/fileTransfer.js";

interface Params {
  containerName: string;
}

/**
 * Endpoint to download files.
 */
export const fileDownload = wrapHandlerHtml<Params>(async (req, res) => {
  const containerNameOrId = req.params.containerName;
  const filepath = req.query.path as string;

  const filePathAbsolute = filepath;

  // Display a nice error if path does not exist,
  // since dockerGetFileOrDirBasedOnExtension can be very obscure
  try {
    await dockerInfoArchive(containerNameOrId, filepath);
  } catch (e) {
    if (e.message.includes("404"))
      e.message = `No file found at:\ncontainer: ${containerNameOrId}\npath: ${filepath}\n\n${e.message}`;
    throw e;
  }

  const filetype = await dockerGetPathType(containerNameOrId, filepath);
  const isSingleFile = filetype === "file";

  // Download single file as same mimetype, directory as .tar
  res.attachment(isSingleFile ? filepath : `${filepath}.tar`);

  await dockerGetFileOrDirBasedOnExtension(
    containerNameOrId,
    filePathAbsolute,
    res,
    { isSingleFile }
  );
});
