# AntigleKit

Free, privacy-first tools you can use online or run locally. Your tools, your files, your device.

## What is AntigleKit?

AntigleKit is a collection of practical utilities for everyday tasks — text processing, developer tools, PDF and document handling, image editing, mathematics, Minecraft blueprints, and more.

Every tool runs entirely in your browser. No uploads, no accounts, no data leaving your device.

## Features

- **${CATALOG.length}+ free tools** across multiple categories
- **100% client-side** — all processing happens in your browser
- **Online or offline** — use it on the web, or download and run locally
- **No accounts** — just open and use
- **Privacy-first** — your files never leave your device
- **Lightweight** — fast loading, minimal dependencies
- **Dark & light themes** — comfortable in any environment
- **Mobile-friendly** — responsive design works on all screen sizes

## Tool Categories

| Category | Examples |
|----------|----------|
| **Text & Data** | Word counter, case converter, text diff, CSV tools, markdown preview |
| **Developer** | UUID generator, Base64, code beautifier, JWT decoder, regex tester, QR codes |
| **PDF & Documents** | PDF merge/split, DOCX conversion |
| **Images** | Image resize, crop, format conversion |
| **Math & Science** | Calculator, unit converter, percentage calculator |
| **Diagrams** | Mermaid flowcharts and diagrams |
| **Minecraft** | Circle/oval/sphere/dome generator with .litematic and .mcpack export |

## Online Usage

Visit the deployed site and start using tools immediately. No installation required.

## Run Locally (Offline)

AntigleKit can run entirely on your computer without internet access.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)

### Steps (Windows)

1. Download the AntigleKit ZIP from GitHub.
2. Extract the ZIP.
3. Open the extracted AntigleKit folder.
4. In Windows File Explorer, click the address bar.
5. Type:
   ```
   cmd
   ```
6. Press Enter. This opens Command Prompt in that folder.
7. Run:
   ```
   npx serve .
   ```
8. The command will provide a local address (e.g., `http://localhost:3000`).
9. Open that address in your browser.

AntigleKit is now running locally on your machine.

### Steps (macOS / Linux)

```bash
# Clone the repository
git clone https://github.com/your-username/antiglekit.git
cd antiglekit/webtools

# Start local server
npx serve .

# Open the provided URL in your browser
```

> **Note:** Some tools load small libraries from a CDN on first use. For full offline capability, these libraries would need to be bundled locally.

## Development

The project uses vanilla JavaScript with ES modules. No build step required for development.

```bash
# Start dev server
cd webtools
npx serve .
```

### Project Structure

```
webtools/
├── index.html              # Main HTML entry point
├── package.json            # Project metadata and scripts
├── assets/
│   ├── css/style.css       # Design system and styles
│   └── js/
│       ├── app.js          # Application shell, router, catalog
│       ├── util.js         # Shared helper functions
│       ├── credits-data.js # Open-source attribution data
│       └── tools/
│           ├── text.js     # Text & data tools
│           ├── dev.js      # Developer tools
│           ├── pdf.js      # PDF & document tools
│           ├── image.js    # Image tools
│           ├── math.js     # Math & science tools
│           ├── diagram.js  # Diagram tools
│           └── mc.js       # Minecraft circle generator
└── README.md
```

## Open Source

AntigleKit is built using permissively licensed open-source projects. Every library is credited with its license (MIT, Apache-2.0, BSD, or ISC).

See the in-app **Open Source & Credits** page for the full attribution list.

## Contributing

Contributions are welcome. If you find a bug or want to add a tool:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npx serve .`
5. Submit a pull request

## License

MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgements

Built with care using ${TOTAL_LIBS}+ open-source projects. Thank you to all the authors and contributors.
