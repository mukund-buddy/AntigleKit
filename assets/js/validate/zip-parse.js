/* zip-parse.js — minimal, dependency-free ZIP parser (central directory
   based). Reads entry names, sizes, methods and offsets; extracts data with
   an injected inflate function (DecompressionStream in browsers, zlib in
   Node). Handles method 0 (stored) and 8 (deflate, raw + zlib fallback).
   Pure module: no DOM; works in Node for tests. */

export const SIG_EOCD = 0x06054b50;
export const SIG_CD = 0x02014b50;
export const SIG_LH = 0x04034b50;

const EOCD_MAX_BACK = 65557;

/* Hard ceiling on how large any single entry may decompress. This stops
   decompression-bomb archives (tiny deflate member claiming a huge
   uncompressed size) from freezing the browser. Pack manifests are a few
   KB; 8 MB is ~1000× headroom. Checked against the STORED size field
   before inflating, so no memory is ever wasted on a bomb. */
export const MAX_DECOMPRESSED = 100 * 1024 * 1024;

export function decodeName(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch (e) {
    return Array.from(bytes).map(function (b) { return String.fromCharCode(b); }).join('');
  }
}

function findEOCD(buffer) {
  const dv = new DataView(buffer);
  const n = buffer.byteLength;
  if (n < 22) return -1;
  const start = Math.max(0, n - EOCD_MAX_BACK);
  for (let i = n - 22; i >= start; i--) {
    if (dv.getUint32(i, true) !== SIG_EOCD) continue;
    const commentLen = dv.getUint16(i + 20, true);
    if (i + 22 + commentLen === n) return i;
  }
  return -1;
}

/**
 * parseZip(buffer) — reads the central directory. Returns
 * { ok, error?, entries: [{name, method, csize, usize, offset, isDir}], count }.
 */
export function parseZip(buffer) {
  if (!(buffer instanceof ArrayBuffer)) {
    return { ok: false, error: 'Expected an ArrayBuffer.', entries: [], count: 0 };
  }
  const dv = new DataView(buffer);
  const n = buffer.byteLength;
  if (n < 22) return { ok: false, error: 'This file is too small to be a ZIP archive.', entries: [], count: 0 };

  const eocd = findEOCD(buffer);
  if (eocd === -1) return { ok: false, error: 'No ZIP end-of-directory record found — this does not look like a .zip/.mcpack file.', entries: [], count: 0 };

  const count = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  const cdSize = dv.getUint32(eocd + 12, true);

  if (count === 0xffff || cdOffset === 0xffffffff) {
    return { ok: false, error: 'ZIP64 archives are not supported yet — re-zip the pack with a standard .zip tool.', entries: [], count: 0 };
  }
  if (cdOffset + cdSize > n) return { ok: false, error: 'Central directory is truncated — the archive may be damaged.', entries: [], count: 0 };

  const entries = [];
  let off = cdOffset;
  for (let i = 0; i < count; i++) {
    if (off + 46 > n || dv.getUint32(off, true) !== SIG_CD) {
      return { ok: false, error: 'Central directory entry ' + (i + 1) + ' is corrupt.', entries: entries, count: i };
    }
    const method = dv.getUint16(off + 10, true);
    const csize = dv.getUint32(off + 20, true);
    const usize = dv.getUint32(off + 24, true);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const commentLen = dv.getUint16(off + 32, true);
    const localOffset = dv.getUint32(off + 42, true);

    if (off + 46 + nameLen > n) {
      return { ok: false, error: 'Central directory entry ' + (i + 1) + ' overruns the file.', entries: entries, count: i };
    }
    const nameBytes = new Uint8Array(buffer, off + 46, nameLen);
    const name = decodeName(nameBytes);
    const isDir = name === '' || /\/$/.test(name);

    entries.push({ name: name, method: method, csize: csize, usize: usize, offset: localOffset, isDir: isDir });
    off += 46 + nameLen + extraLen + commentLen;
  }

  return { ok: true, error: null, entries: entries, count: count };
}

/**
 * readEntryData(buffer, entry, inflateRaw) — extracts an entry's data.
 * inflateRaw(bytes) must return a Promise<Uint8Array> (browser: passed from
 * the tool using DecompressionStream; Node: zlib.inflateRawSync wrapper).
 * Method 0 returns the stored bytes directly.
 */
export async function readEntryData(buffer, entry, inflateRaw) {
  const dv = new DataView(buffer);
  const off = entry.offset;
  if (off + 30 > buffer.byteLength) throw new Error('Local header out of bounds for ' + entry.name);
  if (dv.getUint32(off, true) !== SIG_LH) throw new Error('Missing local file header for ' + entry.name);

  const method = dv.getUint16(off + 8, true);
  const nameLen = dv.getUint16(off + 26, true);
  const extraLen = dv.getUint16(off + 28, true);
  const csize = dv.getUint32(off + 18, true);
  const dataOff = off + 30 + nameLen + extraLen;

  if (dataOff + csize > buffer.byteLength) throw new Error('Entry data out of bounds for ' + entry.name);
  const bytes = new Uint8Array(buffer, dataOff, csize);

  if (typeof entry.usize === 'number' && entry.usize > MAX_DECOMPRESSED) {
    throw new Error(entry.name + ' would decompress to ' + Math.round(entry.usize / 1048576) +
      ' MB — this archive looks like a decompression bomb and was rejected.');
  }

  if (method === 0) return bytes;
  if (method === 8) {
    if (typeof inflateRaw !== 'function') throw new Error('Deflate support is unavailable in this browser.');
    return inflateRaw(bytes);
  }
  throw new Error('Unsupported compression method ' + method + ' for ' + entry.name + ' — re-zip with standard deflate.');
}

/** Case-sensitive lookup by normalized path. */
export function findEntry(entries, path) {
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].name === path) return entries[i];
  }
  return null;
}

/** Case-insensitive lookup; returns { entry, exact } or null. */
export function findEntryCI(entries, path) {
  const lower = path.toLowerCase();
  let found = null;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].name.toLowerCase() === lower) {
      if (entries[i].name === path) return { entry: entries[i], exact: true };
      if (!found) found = { entry: entries[i], exact: false };
    }
  }
  return found;
}
