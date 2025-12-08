import sodium from "libsodium-wrappers";

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await sodium.ready;
    initialized = true;
  }
}

function getKey(): Uint8Array {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return sodium.from_hex(keyHex);
}

export interface EncryptedData {
  nonce: string;
  ciphertext: string;
}

export async function encrypt(plaintext: string): Promise<string> {
  await ensureInit();

  const key = getKey();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = sodium.from_string(plaintext);

  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);

  const data: EncryptedData = {
    nonce: sodium.to_base64(nonce),
    ciphertext: sodium.to_base64(ciphertext)
  };

  return JSON.stringify(data);
}

export async function decrypt(encryptedJson: string): Promise<string> {
  await ensureInit();

  const key = getKey();
  const data: EncryptedData = JSON.parse(encryptedJson);

  const nonce = sodium.from_base64(data.nonce);
  const ciphertext = sodium.from_base64(data.ciphertext);

  const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

  return sodium.to_string(plaintext);
}

export function generateKey(): string {
  // Helper to generate a new encryption key
  const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  return sodium.to_hex(key);
}
