import { box, randomBytes } from "tweetnacl";
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64
} from "tweetnacl-util";

const newNonce = () => randomBytes(box.nonceLength);

export function encrypt(
  plainMessage: string,
  mySecretKey: string,
  theirPublicKey: string
): string {
  const nonce = newNonce();
  const messageUint8 = decodeUTF8(plainMessage);
  const encrypted = box(
    messageUint8,
    nonce,
    decodeBase64(theirPublicKey),
    decodeBase64(mySecretKey)
  );

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  const base64FullMessage = encodeBase64(fullMessage);
  return base64FullMessage;
}

export function decrypt(
  messageWithNonce: string,
  mySecretKey: string,
  theirPublicKey: string
): string {
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(
    box.nonceLength,
    messageWithNonce.length
  );

  const decrypted = box.open(
    message,
    nonce,
    decodeBase64(theirPublicKey),
    decodeBase64(mySecretKey)
  );

  if (!decrypted) {
    throw new Error("Could not decrypt message");
  }

  const plainMessage = encodeUTF8(decrypted);
  return plainMessage;
}
