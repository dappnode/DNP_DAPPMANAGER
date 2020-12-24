import { wrapHandler } from "../utils";
import {
  dockerGetFileOrDirBasedOnExtension,
  dockerGetPathType
} from "../../modules/docker/fileTransfer";

interface Params {
  containerName: string;
}

/**
 * Endpoint to download files.
 */
export const fileDownload = wrapHandler<Params>(async (req, res) => {
  const containerNameOrId = req.params.containerName;
  const filepath = req.query.path as string;

  const filePathAbsolute = filepath;

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
