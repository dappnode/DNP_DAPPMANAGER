import Jimp from "jimp";

export default function resizeImg(
  imageBuffer: Buffer,
  pixelWidth: number
): Promise<Buffer> {
  return Jimp.read(imageBuffer).then(image =>
    image
      .contain(
        pixelWidth,
        pixelWidth,
        Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE
      )
      .getBufferAsync(Jimp.MIME_PNG)
  );
}
