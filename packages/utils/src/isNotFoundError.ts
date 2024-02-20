type NodeSystemError =
  // (Permission denied): An attempt was made to access a file in a way forbidden
  // by its file access permissions.
  | "EACCES"
  // (Address already in use): An attempt to bind a server (net, http, or https)
  // to a local address failed due to another server on the local system already
  // occupying that address.
  | "EADDRINUSE"
  // (Connection refused): No connection could be made because the target machine
  // actively refused it. This usually results from trying to connect to a service
  // that is inactive on the foreign host.
  | "ECONNREFUSED"
  // (Connection reset by peer): A connection was forcibly closed by a peer. This
  // normally results from a loss of the connection on the remote socket due to a
  // timeout or reboot. Commonly encountered via the http and net modules.
  | "ECONNRESET"
  // (File exists): An existing file was the target of an operation that required
  // that the target not exist.
  | "EEXIST"
  // (Is a directory): An operation expected a file, but the given pathname was a
  // directory.
  | "EISDIR"
  // (Too many open files in system): Maximum number of file descriptors allowable
  // on the system has been reached, and requests for another descriptor cannot be
  // fulfilled until at least one has been closed. This is encountered when opening
  // many files at once in parallel, especially on systems (in particular, macOS)
  // where there is a low file descriptor limit for processes. To remedy a low limit,
  // run ulimit -n 2048 in the same shell that will run the Node.js process.
  | "EMFILE"
  // (No such file or directory): Commonly raised by fs operations to indicate that
  // a component of the specified pathname does not exist. No entity (file or directory)
  // could be found by the given path.
  | "ENOENT"
  // (Not a directory): A component of the given pathname existed, but was not a
  // directory as expected. Commonly raised by fs.readdir.
  | "ENOTDIR"
  // (Directory not empty): A directory with entries was the target of an operation
  // that requires an empty directory, usually fs.unlink.
  | "ENOTEMPTY"
  // (DNS lookup failed): Indicates a DNS failure of either EAI_NODATA or EAI_NONAME.
  // This is not a standard POSIX error.
  | "ENOTFOUND"
  // (Operation not permitted): An attempt was made to perform an operation that
  // requires elevated privileges.
  | "EPERM"
  // (Broken pipe): A write on a pipe, socket, or FIFO for which there is no process
  // to read the data. Commonly encountered at the net and http layers, indicative that
  // the remote side of the stream being written to has been closed.
  | "EPIPE"
  // (Operation timed out): A connect or send request failed because the connected
  // party did not properly respond after a period of time. Usually encountered by
  // http or net. Often a sign that a socket.end() was not properly called.
  | "ETIMEDOUT";

interface NodeError extends Error {
  code: NodeSystemError;
}

/**
 * If error is ENOENT, file or dir not found
 * @param e
 */
export function isNotFoundError(e: NodeError): boolean {
  return e.code === "ENOENT";
}
