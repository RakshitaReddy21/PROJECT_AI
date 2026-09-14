/**
 * Utility module for secure password hashing using Web Crypto API.
 * Uses PBKDF2 with SHA-256 and 100,000 iterations + 16-byte salt.
 */

export function generateSalt(): string {
  const saltBytes = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(saltBytes);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(saltBytes);
  } else {
    for (let i = 0; i < 16; i++) {
      saltBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;

  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await cryptoObj.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  return computedHash === expectedHash;
}
