// Diagrams tool
import { $, setStatus, download } from '../util.js';

export const tools = {
  mermaid: {
    desc: 'Render Mermaid diagrams from text, entirely in-browser.',
    render: () => `
      <label for="mm-in">Mermaid code</label>
      <textarea id="mm-in" spellcheck="false" style="min-height:220px">graph TD
  A[Privacy] --> B[In-browser]
  A --> C[No uploads]
  B --> D[(Local files)]</textarea>
      <div class="btn-group">
        <button class="btn btn-primary" id="mm-go">Render</button>
        <button class="btn btn-secondary" id="mm-png">Download PNG</button>
        <button class="btn btn-ghost" id="mm-svg">Download SVG</button>
      </div>
      <div id="mm-out" class="output" style="margin-top:12px;white-space:normal"></div>`,
    init: async () => {
      const mermaid = (await import('mermaid')).default || (await import('mermaid'));
      mermaid.initialize({ startOnLoad: false, theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default', securityLevel: 'strict' });
      const out = $('#mm-out');
      let svgText = '';
      const render = async () => {
        try {
          const { svg } = await mermaid.render('mm' + Date.now(), $('#mm-in').value);
          svgText = svg; out.innerHTML = svg; out.className = 'output ok';
        } catch (e) { setStatus(out, '❌ ' + e.message, 'err'); }
      };
      $('#mm-go').onclick = render; $('#mm-in').addEventListener('input', render); render();
      $('#mm-png').onclick = () => {
        const c = document.createElement('canvas'); const img = new Image();
        img.onload = () => { c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); c.toBlob(b => b && download('diagram.png', b)); };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
      };
      $('#mm-svg').onclick = () => download('diagram.svg', new Blob([svgText], { type: 'image/svg+xml' }));
    },
  },
};
