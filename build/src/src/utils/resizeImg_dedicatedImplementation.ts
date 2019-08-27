const PNG = require("pngjs").PNG;

/**
 * Downsizes a png buffer.
 *
 * It is only able to downsize, if any dimension is larger than source,
 * if will return the input buffer
 *
 * @param {Buffer} inputBuffer source image buffer
 * @param {Int} _width target width
 * @param {Int} _height target heigth
 * @returns {Buffer} png buffer with the target dimensions
 */
function downsizePng(inputBuffer: Buffer, _width: number, _height: number) {
  const inputPng = PNG.sync.read(inputBuffer);
  // Input img
  const { width, height, data } = inputPng;
  if (_width > width || _height > height) {
    return inputBuffer;
  }
  // Output img
  const outputPng = new PNG({ width: _width, height: _height });
  outputPng.data = downSizeAlgorithm(width, height, data, _width, _height);
  return PNG.sync.write(outputPng);
}

/**
 * Downsizes a pixelmap.
 *
 * It is only able to downsize, if any dimension is larger than source,
 * if will return the input data
 *
 * @param {Int} width source width
 * @param {Int} height source heigth
 * @param {Buffer} data source pixel buffer array
 * @param {Int} _width target width
 * @param {Int} _height target heigth
 * @returns {Buffer} pixel buffer array with the target dimensions
 */
function downSizeAlgorithm(
  width: number,
  height: number,
  data: Buffer,
  _width: number,
  _height: number
) {
  const wr = _width / width;
  const hr = _height / height;
  const _data: number[] = [];
  const pxReg: number[] = [];

  if (_width > width || _height > height) {
    throw Error(
      `Unable to downsize data: ${width}x${height} => ${_width}x${_height}`
    );
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const _y = Math.round(y * hr);
      const _x = Math.round(x * wr);
      const _idx = (_width * _y + _x) << 2;
      for (const i of [0, 1, 2, 3]) {
        _data[_idx + i] = (_data[_idx + i] || 0) + data[idx + i];
      }
      pxReg[_idx] = (pxReg[_idx] || 0) + 1;
    }
  }

  for (let _y = 0; _y < _height; _y++) {
    for (let _x = 0; _x < _width; _x++) {
      const _idx = (_width * _y + _x) << 2;
      for (const i of [0, 1, 2, 3]) {
        _data[_idx + i] = Math.round(_data[_idx + i] / pxReg[_idx]);
      }
    }
  }
  return _data;
}

export default downsizePng;
