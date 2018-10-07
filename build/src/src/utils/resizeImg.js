const Jimp = require('jimp');

function resizeImg(imageBuffer, pixelWidth) {
    return Jimp.read(imageBuffer).then((image) =>
    image
      .contain(pixelWidth, pixelWidth, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE)
      .getBufferAsync(Jimp.MIME_PNG)
    );
}

module.exports = resizeImg;
