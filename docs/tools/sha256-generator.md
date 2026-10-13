# SHA-256 Generator

Compute a SHA-256 cryptographic hash from any text or file, entirely in your browser. No uploads, no tracking — your data stays on your device.

## What it does

The SHA-256 Generator takes input — either a string of text or the raw bytes of a file — and produces a fixed 64-character hexadecimal digest. This digest is a unique fingerprint of the input: change even a single character and the entire hash changes.

## How to use

### Text mode

1. Make sure the **Text** tab is selected (it is by default).
2. Type or paste your text into the input field.
3. Optionally tick **Uppercase hex output** to display the digest in uppercase.
4. Click **Generate hash** — the SHA-256 digest appears instantly.

### File mode

1. Click the **File** tab to switch modes.
2. Choose a file from your device, or drag it onto the drop area.
3. The tool reads the file's raw bytes and computes the digest automatically — no need to click Generate.
4. The file name and size are displayed; the hex digest appears below.

## Understanding the output

A SHA-256 digest is always **64 hexadecimal characters** (0–9, a–f), representing 256 bits of output. It is:

- **Deterministic** — the same input always produces the same hash.
- **One-way** — you cannot reconstruct the original data from the digest.
- **Collision-resistant** — it is computationally infeasible to find two different inputs that produce the same hash.

For example, the string hello hashes to:

`
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
`

Changing a single letter — hallo — produces a completely different digest.

## Algorithm note

Text hashing uses the Web Crypto API's crypto.subtle.digest('SHA-256', ...) via the sha256() helper in alidate/security-tools.js. File hashing uses the same API directly: the file is read as an ArrayBuffer, digested, and converted to hex. Both paths are standard SHA-256 as defined in FIPS 180-4.

## Privacy note

All hashing runs locally in your browser. Neither the text you type nor the files you select are uploaded to any server. The digest exists only on your device until you copy it.