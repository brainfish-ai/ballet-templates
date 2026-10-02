import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text, max) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      lines.push(line.trim());
      line = w;
    } else {
      line = `${line} ${w}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 3);
}

/** 1280x640 social preview. SVG is always written; a PNG is added when rsvg-convert is installed. */
export function writeSocialPreview(basePath, { title, tagline }) {
  const lines = wrap(tagline, 52);
  const tspans = lines.map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 46}">${esc(l)}</tspan>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
  <rect width="1280" height="640" fill="#0a0a0a"/>
  <rect x="24" y="24" width="1232" height="592" rx="20" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="2"/>
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" fill="#ffffff">
    <text x="80" y="120" font-size="26" font-weight="600" fill-opacity="0.6" letter-spacing="3">BALLET</text>
    <text x="80" y="240" font-size="68" font-weight="700">${esc(title)}</text>
    <text x="80" y="330" font-size="34" fill-opacity="0.72">${tspans}</text>
    <rect x="80" y="500" width="250" height="60" rx="12" fill="#ffffff"/>
    <text x="205" y="539" font-size="26" font-weight="700" fill="#0a0a0a" text-anchor="middle">Import to Ballet</text>
  </g>
</svg>
`;
  writeFileSync(`${basePath}.svg`, svg);
  const res = spawnSync('rsvg-convert', ['-w', '1280', '-h', '640', '-o', `${basePath}.png`, `${basePath}.svg`], {
    stdio: 'ignore',
  });
  return res.status === 0;
}
