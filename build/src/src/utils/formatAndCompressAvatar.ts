import resizeImg from "./resizeImg";
import imageminPngquant from "imagemin-pngquant";
import Logs from "../logs";
const logs = Logs(module);

const outputResolution = 200;

/**
 * Fetching DAppNode's directory can be slow. The highest payload are the packages' avatars
 * The avatars are encouraged to be of a certain size, but we cannot control what future
 * devs put as the avatar of their package. Also, the recommended size of the avatar
 * is ~600x600px to ensure usability in future use cases. However, the current ADMIN UI
 * only needs ~200x200px resolution.
 *
 * This utility helps reduce the load and proctect agains big avatars.
 *
 * The compression should only be computed once, as the directory is cached
 * The size reduction are:
 * (KBs, sum of all 14 avatars for the current directory, where most are already compressed)
 * (Source resolution averages 600x600px, output resolution is 200x200px)
 *
 * Source (base64)      473.156 KB
 * Compressed (base64)  144.704 KB (-70%)
 *
 * Benchmarks on a personal laptop showed on average (current 14 avatars) in SERIES:
 *
 * 120 ms / avatar
 */

/**
 * Resizes and compresses an image to a specific size. Returns square png
 *
 * @param {Buffer} inputBuffer Can be a Buffer or path to the image
 * @param {Integer} outputResolution The image is forced to be a square of
 *                                   outputResolution x outputResolution px
 * @returns {string} base64 representation of the image
 */
export default async function formatAndCompressAvatar(
  inputBuffer: Buffer
): Promise<string> {
  let compressedImgBuffer;
  try {
    const resizedImgBuffer = await resizeImg(inputBuffer, outputResolution);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const OPTION_TO_BYPASS_MISSTYPED_MODULE: any = { quality: "0-95" }; // :(
    compressedImgBuffer = await imageminPngquant(
      OPTION_TO_BYPASS_MISSTYPED_MODULE
    )(resizedImgBuffer);
  } catch (e) {
    logs.warn(`Error compressing avatar: ${e.stack}`);
  }

  const outputBuffer =
    compressedImgBuffer && compressedImgBuffer.length < inputBuffer.length
      ? compressedImgBuffer
      : inputBuffer;

  return "data:image/png;base64," + outputBuffer.toString("base64");
}
