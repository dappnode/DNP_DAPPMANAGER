/**
 * Minimal decoder for the UnixFS `Data` protobuf message carried in DAG-PB nodes. Only the fields
 * needed to map a file's child blocks to byte ranges are decoded.
 *
 * message Data {
 *   required DataType Type = 1;   // Raw = 0, Directory = 1, File = 2, Metadata = 3, Symlink = 4, HAMTShard = 5
 *   optional bytes Data = 2;
 *   optional uint64 filesize = 3;
 *   repeated uint64 blocksizes = 4;
 *   ...
 * }
 */

export const UnixfsType = {
  Raw: 0,
  Directory: 1,
  File: 2,
  Metadata: 3,
  Symlink: 4,
  HAMTShard: 5
} as const;

export interface UnixfsData {
  type: number;
  data?: Uint8Array;
  filesize?: number;
  blocksizes: number[];
}

export function unixfsTypeName(type: number): string {
  const entry = Object.entries(UnixfsType).find(([, value]) => value === type);
  return entry ? entry[0].toLowerCase() : `unknown (${type})`;
}

export function decodeUnixfsData(bytes: Uint8Array): UnixfsData {
  let pos = 0;
  const result: UnixfsData = { type: -1, blocksizes: [] };

  const readVarint = (end: number): number => {
    let value = 0;
    let multiplier = 1;
    for (;;) {
      if (pos >= end) throw Error("Invalid UnixFS data: truncated varint");
      const byte = bytes[pos++];
      value += (byte & 0x7f) * multiplier;
      if ((byte & 0x80) === 0) return value;
      multiplier *= 128;
      if (multiplier > 2 ** 63) throw Error("Invalid UnixFS data: varint too long");
    }
  };

  while (pos < bytes.length) {
    const key = readVarint(bytes.length);
    const field = Math.floor(key / 8);
    const wireType = key & 7;
    switch (wireType) {
      case 0: {
        const value = readVarint(bytes.length);
        if (field === 1) result.type = value;
        else if (field === 3) result.filesize = value;
        else if (field === 4) result.blocksizes.push(value);
        break;
      }
      case 2: {
        const length = readVarint(bytes.length);
        const end = pos + length;
        if (end > bytes.length) throw Error("Invalid UnixFS data: truncated field");
        if (field === 2) {
          result.data = bytes.subarray(pos, end);
        } else if (field === 4) {
          // Packed encoding of blocksizes
          while (pos < end) result.blocksizes.push(readVarint(end));
        }
        pos = end;
        break;
      }
      case 1:
        pos += 8;
        break;
      case 5:
        pos += 4;
        break;
      default:
        throw Error(`Invalid UnixFS data: unsupported wire type ${wireType}`);
    }
  }
  if (pos > bytes.length) throw Error("Invalid UnixFS data: truncated field");
  if (result.type === -1) throw Error("Invalid UnixFS data: missing type");
  return result;
}
