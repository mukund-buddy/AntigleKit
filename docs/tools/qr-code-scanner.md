# QR Scanner

Page: `tools/qr-code-scanner/index.html`
Logic: `assets/js/tools/qr-code-scanner.js` over `assets/js/validate/security-tools.js` (`qrDecode`)
Data: none · Catalog id: `qr-code-scanner` (category `security`)

---

## What it does

Turns an image containing a QR code into the text it encodes. You upload a
screenshot, photo or saved picture; the tool draws it to a canvas, reduces it
to black and white, rebuilds the QR module grid, and hands that grid to the
site's own `qrDecode` implementation — the same codebase that powers the QR
Code Generator. The result includes the decoded text plus the code's version,
error-correction level, mask pattern, and whether Reed–Solomon repaired any
damaged bytes.

There is no camera, no third-party decoding library, and no network call.

## How to use

1. Open the tool and click the drop zone (or drag an image onto it).
2. Pick any image file containing a QR code — PNG, JPG, WebP, GIF or BMP.
3. Scanning starts automatically the moment a file is selected. You can also
   press **Scan** to re-run it.
4. The preview shows the image that was read; the result panel shows the
   decoded text with a **Copy result** button.
5. **Scan another** clears the file, the preview and the result.

## Tips for best results

- **Use a screenshot when you can.** A pixel-perfect screenshot decodes far
  more reliably than a photo of a screen or a printed page.
- **Shoot straight on.** The grid is sampled on a regular lattice, so
  perspective skew, rotation or a curved surface will break the sampling.
- **Keep contrast high.** Dark modules on a light background. Inverted
  (light-on-dark) codes, heavy colour tints and low-light photos are the most
  common failures.
- **Crop tight, but keep the quiet zone.** Extra dark furniture, borders or
  logos in the frame widen the detected bounding box and shift the grid.
  A small light margin around the code is ideal.
- **Avoid blur and glare.** Motion blur, reflections and JPEG artefacts smear
  module edges; the majority-vote sampler tolerates a little, not a lot.
- **Bigger is fine.** Large images are scaled down to about 600px internally,
  so upload size is not a problem — sharpness is.

## Supported content

Whatever the QR code encodes is returned verbatim as text:

- URLs (`https://…`) — the most common case.
- Plain text and notes.
- Wi-Fi credentials (`WIFI:S:…;T:WPA;P:…;;`).
- Contact cards (`BEGIN:VCARD…`), calendar events, `mailto:`, `tel:` and
  `sms:` links.
- Payment strings such as UPI or EMV QR payloads.
- Any custom string an app has embedded.

The tool decodes byte, numeric, alphanumeric and Kanji segments across QR
versions 1–40 and all four error-correction levels (L, M, Q, H). It does not
follow, open or validate links — it only shows you the text, which is exactly
what you want before deciding whether a code is safe to visit.

## Privacy note

The image is processed entirely on your device. It is read with the browser's
`FileReader`, drawn to a canvas in the page, and decoded by JavaScript running
in your tab. Nothing is uploaded to a server, nothing is stored, and nothing is
logged. Close the tab and every trace is gone. The tool works offline once the
page has loaded.
