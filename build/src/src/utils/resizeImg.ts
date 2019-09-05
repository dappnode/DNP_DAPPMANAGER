import Jimp from "jimp";

export default function resizeImg(imageBuffer: Buffer, pixelWidth: number) {
  return Jimp.read(imageBuffer).then((image: any) =>
    image
      .contain(
        pixelWidth,
        pixelWidth,
        Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE
      )
      .getBufferAsync(Jimp.MIME_PNG)
  );
}
