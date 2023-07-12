import tweetnacl from "tweetnacl";
import tweetnaclUtil from "tweetnacl-util";

export function generateKeyPair(): {
  publicKey: string;
  secretKey: string;
} {
  const keys = tweetnacl.box.keyPair();
  return {
    publicKey: tweetnaclUtil.encodeBase64(keys.publicKey),
    secretKey: tweetnaclUtil.encodeBase64(keys.secretKey)
  };
}

export function encrypt(
  plainMessage: string,
  mySecretKey: string,
  theirPublicKey: string
): string {
  const nonce = tweetnacl.randomBytes(tweetnacl.box.nonceLength);
  const messageUint8 = tweetnaclUtil.decodeUTF8(plainMessage);
  const encrypted = tweetnacl.box(
    messageUint8,
    nonce,
    tweetnaclUtil.decodeBase64(theirPublicKey),
    tweetnaclUtil.decodeBase64(mySecretKey)
  );

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  const base64FullMessage = tweetnaclUtil.encodeBase64(fullMessage);
  return base64FullMessage;
}

export function decrypt(
  messageWithNonce: string,
  mySecretKey: string,
  theirPublicKey: string
): string {
  const messageWithNonceAsUint8Array =
    tweetnaclUtil.decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(
    0,
    tweetnacl.box.nonceLength
  );
  const message = messageWithNonceAsUint8Array.slice(
    tweetnacl.box.nonceLength,
    messageWithNonce.length
  );

  const decrypted = tweetnacl.box.open(
    message,
    nonce,
    tweetnaclUtil.decodeBase64(theirPublicKey),
    tweetnaclUtil.decodeBase64(mySecretKey)
  );

  if (!decrypted) {
    throw new Error("Could not decrypt message");
  }

  const plainMessage = tweetnaclUtil.encodeUTF8(decrypted);
  return plainMessage;
}
