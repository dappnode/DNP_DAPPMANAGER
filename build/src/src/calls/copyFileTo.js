const dataUriToBuffer = require("data-uri-to-buffer");
// Modules
const docker = require("modules/docker");

/**
 * Copy file to a DNP:
 *
 * @param {string} id DNP .eth name
 * @param {string} dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 * @param {string} filename name of the uploaded file.
 * - MUST NOT be a path: "/app", "app/", "app/file.txt"
 * @param {string} toPath path to copy a file to
 * - If path = path to a directory: "/usr/src/app".
 *   Copies the contents of dataUri to ${dir}/${filename}
 * - If path = relative path: "app".
 *   Path becomes $WORKDIR/app, then copies the contents of dataUri there
 *   Same for relative paths to directories.
 * - If empty, defaults to $WORKDIR
 */
const copyFileTo = async ({ id, dataUri, filename, toPath }) => {
  if (!id) throw Error("Argument id must be defined");
  if (!dataUri) throw Error("Argument dataUri must be defined");
  if (!filename) throw Error("Argument filename must be defined");
  // toPath is allowed to be empty, it will default to WORKDIR
  // if (!toPath) throw Error("Argument toPath must be defined");
  if (filename.includes("/"))
    throw Error(`filename must not be a path: ${filename}`);

  /**
   * Convert dataUri to buffer
   *
   * In this conversion direction MIME types don't matter
   * The extension is what decides the type and it's the user's
   * responsability to specify it correctly on the UI. The code will
   * not cause problems if the types are not setup corretly
   */
  const content = dataUriToBuffer(dataUri);

  // Copy file from local file system to container
  docker.copyFileTo(id, { pathContainer: toPath, content, filename });

  return {
    message: `Copied file: ${filename} to: ${id} path: ${toPath}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = copyFileTo;
