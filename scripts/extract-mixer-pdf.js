const fsp = require('fs/promises');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const { createWorker } = require('tesseract.js');

const MODELS = ['0.8m3','1.5m3','2m3','2.6m3','3.5m3','4m3','5m3'];
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const safe = model => model.replace('.', '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
const capture = (text, pattern) => clean(text.match(pattern)?.[1] || '');

function parseSpecifications(text, model) {
  const specs = {
    'Rated Capacity': model.replace('m3', ' m³'),
    'Curb Weight': capture(text, /Curb\s+Weight\s+([0-9,.]+\s*kg)/i),
    'Engine Model': capture(text, /Engine\s+Model\s+([A-Z0-9 -]{3,30}?)(?=Rated\s+Power|\n)/i),
    'Rated Power': capture(text, /Rated\s+Power\s+([0-9,.]+\s*kW)/i),
    'Tank Volume': capture(text, /Tank\s+Volume\s+([0-9,.]+\s*m[³3])/i),
    'Water Tank Capacity': capture(text, /Water\s+Tank\s+Capacity\s+([0-9,.]+\s*L)/i),
    'Maximum Travel Speed': capture(text, /Max\.?\s*Travel\s+Speed\s+([≤0-9,. ]+\s*km\/h)/i),
    'Dimensions': capture(text, /Dimension\s*\(L\*W\*H\)\s*([0-9*×x ]+\s*mm)/i)
  };
  return Object.fromEntries(Object.entries(specs).filter(([,value]) => value));
}

async function extractMixerProducts({ pdfPath, outputDir }) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(await fsp.readFile(pdfPath));
  const document = await pdfjs.getDocument({ data }).promise;
  if (document.numPages < MODELS.length) throw new Error(`Mixer PDF has ${document.numPages} pages; expected at least ${MODELS.length}.`);
  await fsp.rm(outputDir, { recursive: true, force: true });
  await fsp.mkdir(outputDir, { recursive: true });
  const worker = await createWorker('eng');
  const products = [];
  try {
    for (let index = 0; index < MODELS.length; index++) {
      const model = MODELS[index];
      const page = await document.getPage(index + 1);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = createCanvas(viewport.width, viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const buffer = canvas.toBuffer('image/png');
      const filename = `${safe(model)}-1.png`;
      // Crop to the machine photography only; omit brochure headings and specification tables.
      const cropX=Math.round(viewport.width*.48),cropY=Math.round(viewport.height*.04),cropW=Math.round(viewport.width*.48),cropH=Math.round(viewport.height*.29);
      const cover=createCanvas(1200,700);
      cover.getContext('2d').drawImage(canvas,cropX,cropY,cropW,cropH,0,0,1200,700);
      await fsp.writeFile(path.join(outputDir,filename),cover.toBuffer('image/png'));
      const result = await worker.recognize(buffer);
      const specifications = parseSpecifications(result.data.text, model);
      products.push({
        id: `pdf-mixer-${safe(model)}`,
        brand: 'XCMG',
        name: `${model.replace('m3',' m³')} Self Loading Concrete Mixer`,
        model,
        category: 'mixer',
        subCategory: 'self-loading-concrete-mixer',
        source: 'pdf',
        image: `/uploads/self-loading-mixer/${filename}`,
        images: [`/uploads/self-loading-mixer/${filename}`],
        description: `Self-loading concrete mixer with ${model.replace('m3',' m³')} rated discharge capacity, combining loading, mixing, transport and discharge in one machine.`,
        specifications,
        localOnly: true
      });
      console.error(`[mixer:${index + 1}/${MODELS.length}] ${model}`);
    }
  } finally { await worker.terminate(); }
  return products;
}

module.exports = { extractMixerProducts, parseSpecifications, MODELS };

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const dataFile = path.join(root, 'data', 'products.json');
  extractMixerProducts({
    pdfPath: path.resolve(root, '..', '..', 'work', 'self-loading-mixer.pdf'),
    outputDir: path.join(root, 'public', 'uploads', 'self-loading-mixer')
  }).then(async mixers => {
    const current = JSON.parse(await fsp.readFile(dataFile, 'utf8'));
    await fsp.writeFile(dataFile, JSON.stringify([...current.filter(item => item.category !== 'mixer'), ...mixers], null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({ success: true, mixers: mixers.length }));
  }).catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
}
