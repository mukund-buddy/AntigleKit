# Barcode Generator

## What it does

Creates scannable barcodes in four formats — Code 128, Code 39, EAN-13 and
UPC-A — and lets you download them as PNG. Bar patterns, check digits and
rendering all happen in your browser; there is no API call, no upload and no
third-party image service.

- **Code 128** is the default: compact, supports the full printable ASCII set,
  and appends a mod-103 checksum symbol so every scan is verified.
- **Code 39** covers A–Z, 0–9 and `- . space $ / + %` with an optional mod-43
  check digit for longer IDs.
- **EAN-13** and **UPC-A** are retail formats: digits only, with the correct
  parity pattern and a mod-10 check digit added automatically.

## How to use

1. Type or paste your text or number into **Text or number**.
2. Pick the **Format** that fits your use case (see table below).
3. Drag the **Bar height** slider for the physical height you need.
4. Toggle **Show text under the bars** to print the human-readable caption
   (EAN-13 and UPC-A captions get guard-bar spacing automatically).
5. Toggle **Code 39 check digit (mod 43)** when you want the extra validation
   character on Code 39 output.
6. Click **Generate**. The preview appears with a module/symbol count.
7. Click **Download PNG** to save as `barcode-<format>.png`, or **Copy text** to
   copy the original input.

Changing the height, format or toggles after a successful generate re-renders
immediately. Press `Ctrl` + `Enter` inside the text box as a shortcut for
Generate.

## Which format should I pick?

| Format | Content | Check digit | Best for |
|--------|---------|-------------|----------|
| **Code 128** | Printable ASCII (32–126) | mod-103, always | General labels, inventory, asset tags — the most compact choice |
| **Code 39** | A–Z, 0–9, `- . space $ / + %` | mod-43, optional | Simple alphanumeric IDs, legacy scanners |
| **EAN-13** | 12 digits (13th auto) | mod-10, always | Retail product packaging (GTIN-13) |
| **UPC-A** | 11 digits (12th auto) | mod-10, always | North American retail (GTIN-12) |

## About the output

- Bars are drawn as exact module rectangles at an integer pixel scale with the
  format's standard quiet zone either side, so the exported PNG scans cleanly at
  label and packaging sizes.
- Input length is capped (80 characters for Code 128, 60 for Code 39) because
  long codes become physically dense and unreliable to scan.
- EAN-13 and UPC-A always compute and append the check digit; providing a 13th
  or 12th digit yourself is accepted and verified against the same rule.
- **Download PNG** saves the file using a canvas blob — generated locally, never
  round-tripped through a server.

## Privacy note

Everything runs client-side. Your input is never transmitted, stored, logged or
analysed — it lives only in the page until you close or reload the tab. That
makes it safe for serial numbers, internal SKUs and pre-release labels.
