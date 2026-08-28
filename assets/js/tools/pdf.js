// PDF & Documents tools
import { $, download, setStatus } from '../util.js';

function buf(f) { return f.arrayBuffer(); }

export const tools = {
  /* ── PDF Tools ── */
  pdf: {
    desc: 'Merge, split, read metadata or re-save PDF files.',
    render: () => `
      <label for="pf-mode">Action</label>
      <select id="pf-mode">
        <option value="merge">Merge multiple PDFs</option>
        <option value="split">Split (extract pages)</option>
        <option value="meta">Read metadata</option>
        <option value="opt">Re-save / optimise</option>
      </select>
      <div id="pf-dyn"></div>
      <div class="btn-group"><button class="btn btn-primary" id="pf-run">Run</button></div>
      <div class="output" id="pf-out" style="margin-top:12px"></div>`,
    init: async () => {
      const { PDFDocument } = await import('pdf-lib');
      const dyn = $('#pf-dyn'), out = $('#pf-out');
      const renderDyn = () => {
        const m = $('#pf-mode').value;
        if (m === 'merge') dyn.innerHTML = `<label>PDF files (select several)</label><input type="file" id="pf-files" accept="application/pdf" multiple />`;
        else if (m === 'split') dyn.innerHTML = `<label>PDF file</label><input type="file" id="pf-file" accept="application/pdf" /><label for="pf-pages">Page numbers (e.g. 1,3,5-7)</label><input type="text" id="pf-pages" placeholder="1,3,5-7" />`;
        else dyn.innerHTML = `<label>PDF file</label><input type="file" id="pf-file" accept="application/pdf" />`;
      };
      $('#pf-mode').addEventListener('change', renderDyn); renderDyn();

      const parsePages = (s, total) => {
        const set = new Set(); s.split(',').forEach(p => {
          p = p.trim(); if (!p) return;
          if (p.includes('-')) { const [a, b] = p.split('-').map(Number); for (let i = Math.max(1, a); i <= Math.min(total, b); i++) set.add(i - 1); }
          else set.add(Number(p) - 1);
        }); return [...set].filter(i => i >= 0 && i < total);
      };
      $('#pf-run').onclick = async () => {
        const m = $('#pf-mode').value; set(out, '⏳ working…');
        try {
          if (m === 'merge') {
            const files = $('#pf-files').files; if (!files.length) throw new Error('select PDFs');
            const merged = await PDFDocument.create();
            for (const f of files) { const src = await PDFDocument.load(await buf(f)); const ps = await merged.copyPages(src, src.getPageIndices()); ps.forEach(p => merged.addPage(p)); }
            const b = await merged.save();
            download('merged.pdf', new Blob([b], { type: 'application/pdf' }));
            set(out, `✅ Merged ${files.length} file(s) → merged.pdf`, 'ok');
          } else if (m === 'split' || m === 'meta' || m === 'opt') {
            const f = $('#pf-file').files[0]; if (!f) throw new Error('select a PDF');
            const pdf = await PDFDocument.load(await buf(f));
            const total = pdf.getPageCount();
            if (m === 'meta') {
              const info = {
                pages: total, title: pdf.getTitle() || '', author: pdf.getAuthor() || '',
                subject: pdf.getSubject() || '', keywords: pdf.getKeywords() || '', creator: pdf.getCreator() || '', producer: pdf.getProducer() || '',
              };
              set(out, JSON.stringify(info, null, 2), 'ok');
            } else if (m === 'split') {
              const idx = parsePages($('#pf-pages').value, total);
              if (!idx.length) throw new Error('enter page numbers');
              const out2 = await PDFDocument.create(); const ps = await out2.copyPages(pdf, idx); ps.forEach(p => out2.addPage(p));
              const b = await out2.save(); download('split.pdf', new Blob([b], { type: 'application/pdf' })); set(out, `✅ Extracted ${idx.length} page(s) → split.pdf`, 'ok');
            } else {
              const b = await pdf.save(); download('optimised.pdf', new Blob([b], { type: 'application/pdf' }));
              set(out, `✅ Re-saved (${total} pages) → optimised.pdf`, 'ok');
            }
          }
        } catch (e) { setStatus(out, '❌ ' + e.message, 'err'); }
      };
    },
  },

  /* ── DOCX Tools ── */
  docx: {
    desc: 'Convert Markdown → DOCX, or DOCX → HTML.',
    render: () => `
      <label for="dx-mode">Action</label>
      <select id="dx-mode">
        <option value="md2docx">Markdown → DOCX</option>
        <option value="docx2html">DOCX → HTML</option>
      </select>
      <div id="dx-dyn"></div>
      <div class="btn-group"><button class="btn btn-primary" id="dx-run">Run</button></div>
      <div class="output" id="dx-out" style="margin-top:12px"></div>`,
    init: async () => {
      const dyn = $('#dx-dyn'), out = $('#dx-out');
      const render = () => {
        $('#dx-mode').value === 'md2docx'
          ? dyn.innerHTML = `<label for="dx-md">Markdown</label><textarea id="dx-md" placeholder="# Title&#10;Some **text**."></textarea>`
          : dyn.innerHTML = `<label>DOCX file</label><input type="file" id="dx-file" accept=".docx" />`;
      };
      $('#dx-mode').addEventListener('change', render); render();

      $('#dx-run').onclick = async () => {
        set(out, '⏳ working…');
        try {
          if ($('#dx-mode').value === 'md2docx') {
            const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import('docx');
            const lines = $('#dx-md').value.split('\n');
            const children = [];
            for (const ln of lines) {
              const h = ln.match(/^(#{1,4})\s+(.*)$/);
              if (h) children.push(new Paragraph({ text: h[2], heading: 'HEADING_' + h[1].length }));
              else if (ln.trim()) children.push(new Paragraph({ children: [new TextRun(ln)] }));
            }
            const doc = new Document({ sections: [{ children: children.length ? children : [new Paragraph('')] }] });
            const blob = await Packer.toBlob(doc); download('document.docx', blob);
            set(out, '✅ Generated document.docx', 'ok');
          } else {
            const f = $('#dx-file').files[0]; if (!f) throw new Error('select a .docx');
            const mammoth = (await import('mammoth')).default || (await import('mammoth'));
            const res = await mammoth.convertToHtml({ arrayBuffer: await buf(f) });
            set(out, res.value, 'ok'); out.innerHTML = res.value;
          }
        } catch (e) { setStatus(out, '❌ ' + e.message, 'err'); }
      };
    },
  },
};
