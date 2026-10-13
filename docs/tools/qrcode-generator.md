# QR Code Generator

## What it does

Turns any text or URL into a standard, scannable QR code and lets you download it
as a PNG. Encoding, masking and rendering all happen in your browser — there is no
API call, no upload and no third-party image service.

The generator uses byte mode (UTF-8), automatically picks the smallest QR version
that fits your input, evaluates all eight mask patterns and keeps the one with the
best penalty score, so the resulting grid is as easy to scan as possible.

## How to use

1. Type or paste your text, URL, Wi-Fi string or contact details into **Text or URL**.
2. Choose an **Error correction** level — `M` is a good default.
3. Drag the **Quiet zone** slider to set how much white border surrounds the code
   (2–4 modules is recommended; scanners need some blank space).
4. Click **Generate**. The preview appears on the right along with the module count
   and level, e.g. `25 × 25 modules · Level M`.
5. Click **Download PNG** to save the image, or **Copy text** to copy the original
   input back to your clipboard.

Changing the level or quiet zone after a successful generate re-renders the code
immediately. Press `Ctrl` + `Enter` inside the text box as a shortcut for Generate.

## Error-correction levels

| Level | Recovery | When to use |
|-------|----------|-------------|
| **L** | ~7%  | Clean digital use — websites, slides, anywhere the code is displayed sharply. Produces the smallest grid for a given input. |
| **M** | ~15% | The everyday default. Good balance of size and resilience for screens and normal printing. |
| **Q** | ~25% | Printed small, on packaging, or on surfaces that may get scuffed, curved or partly shadowed. |
| **H** | ~30% | Codes with a logo overlaid in the centre, outdoor signage, stickers, or anything likely to be damaged or dirty. |

Higher levels add redundant codewords, which means a larger grid for the same
input. If your code becomes too dense to scan reliably, shorten the text (use a
link shortener for long URLs) before dropping the level.

## About the output

- The matrix is drawn at **10 pixels per module**, so a 25 × 25 code with a
  2-module quiet zone exports at 290 × 290 pixels — crisp enough for both screen
  and typical print use.
- Colours are plain black on white, the highest-contrast combination and the safest
  for every scanner.
- **Download PNG** saves the file as `qrcode.png` using a canvas blob, so the image
  is generated locally and never round-trips through a server.
- The quiet zone is baked into the exported PNG. Keep at least 2 modules of margin
  if you plan to place the code on a coloured background.

## Privacy note

Everything runs client-side. Your input is never transmitted, stored, logged or
analysed — it lives only in the page until you close or reload the tab. That makes
it safe for Wi-Fi passwords, private links and internal references, though you
should still treat the downloaded image itself as sensitive if the content is.
