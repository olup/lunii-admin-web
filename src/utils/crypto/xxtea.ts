/**********************************************************\
|                                                          |
| xxtea.ts                                                 |
|                                                          |
| XXTEA encryption algorithm library for browsers.         |
|                                                          |
| Encryption Algorithm Authors:                            |
|      David J. Wheeler                                    |
|      Roger M. Needham                                    |
|                                                          |
| Code Author: Ma Bingyao <mabingyao@gmail.com>            |
| LastModified: Jan 13, 2023                               |
|                                                          |
\**********************************************************/

"use strict";

const delta = 0x9e3779b9;

export function toUint8Array(
  v: Uint32Array,
  includeLength: boolean = false
): Uint8Array | null {
  const length = v.length;
  let n = length << 2;
  if (includeLength) {
    const m = v[length - 1];
    n -= 4;
    if (m < n - 3 || m > n) {
      return null;
    }
    n = m;
  }
  const bytes = new Uint8Array(n);
  for (let i = 0; i < n; ++i) {
    bytes[i] = v[i >> 2] >> ((i & 3) << 3);
  }
  return bytes;
}

export function toUint32Array(
  bytes: Uint8Array,
  littleEndian: boolean = true,
  includeLength: boolean = false
): Uint32Array {
  const length = bytes.length;
  let n = length >> 2;
  if ((length & 3) !== 0) {
    ++n;
  }
  let v: Uint32Array;
  if (includeLength) {
    v = new Uint32Array(n + 1);
    v[n] = length;
  } else {
    v = new Uint32Array(n);
  }

  if (littleEndian) {
    for (let i = 0; i < length; ++i) {
      v[i >> 2] |= bytes[i] << ((i & 3) << 3);
    }
  } else {
    for (let i = 0; i < length; ++i) {
      v[i >> 2] |= bytes[length - 1 - i] << ((i & 3) << 3);
    }
    v.reverse();
  }

  return v;
}

export function mx(
  sum: number,
  y: number,
  z: number,
  p: number,
  e: number,
  k: Uint32Array
): number {
  return (
    (((z >>> 5) ^ (y << 2)) + ((y >>> 3) ^ (z << 4))) ^
    ((sum ^ y) + (k[(p & 3) ^ e] ^ z))
  );
}

export function encryptUint32Array(
  v: Uint32Array,
  k: Uint32Array
): Uint32Array {
  const length = v.length;
  const n = length - 1;
  let y, z, sum, e, p, q;
  z = v[n];
  sum = 0;
  for (q = Math.floor(1 + 52 / length) | 0; q > 0; --q) {
    sum += delta;
    e = (sum >>> 2) & 3;
    for (p = 0; p < n; ++p) {
      y = v[p + 1];
      z = v[p] += mx(sum, y, z, p, e, k);
    }
    y = v[0];
    z = v[n] += mx(sum, y, z, p, e, k);
  }
  return v;
}

export function decryptUint32Array(
  v: Uint32Array,
  k: Uint32Array
): Uint32Array {
  const length = v.length;
  const n = length - 1;
  let y, z, sum, e, p;
  const q = Math.floor(1 + 52 / length);
  y = v[0];
  for (sum = q * delta; sum !== 0; sum -= delta) {
    e = (sum >>> 2) & 3;
    for (p = n; p > 0; --p) {
      z = v[p - 1];
      y = v[p] -= mx(sum, y, z, p, e, k);
    }
    z = v[n];
    y = v[0] -= mx(sum, y, z, p, e, k);
  }
  return v;
}

export const encryptXxtea = (key: Uint8Array) => async (block: Uint8Array) => {
  const dataInt = toUint32Array(block);
  const keyInt = toUint32Array(key, false);

  const encryptedIntData = encryptUint32Array(dataInt, keyInt);
  return toUint8Array(encryptedIntData);
};

export const decryptXxtea = (key: Uint8Array) => (block: Uint8Array) => {
  const dataInt = toUint32Array(block);
  const keyInt = toUint32Array(key, false);

  const encryptedIntData = decryptUint32Array(dataInt, keyInt);
  return toUint8Array(encryptedIntData);
};
