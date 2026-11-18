// A tool's colour and glyph, read off its logo: the puzzle lays each tool's
// piece in its own colour with its logo on top, so it needs both. The colour
// is a tile's own where the logo is a tile, otherwise the logo's strongest
// hue (or one given, for logos too many-coloured to read one off); the glyph
// is the logo with its ground taken away, in white, to tint as needed.

export interface Brand {
  /** The glyph, white on clear, `size` square. */
  glyph: HTMLCanvasElement;
  /** The tool's colour, as #rrggbb. */
  color: string;
}

const SIZE = 128;
const cache = new Map<string, Promise<Brand>>();

export function readBrand(src: string, color?: string): Promise<Brand> {
  const key = `${src}|${color ?? ""}`;
  if (!cache.has(key)) cache.set(key, load(src, color));
  return cache.get(key)!;
}

function load(src: string, color?: string): Promise<Brand> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = reject;
    img.onload = () => resolve(read(img, color));
    img.src = src;
  });
}

function read(img: HTMLImageElement, color?: string): Brand {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, SIZE, SIZE);
  const src8 = g.getImageData(0, 0, SIZE, SIZE).data;
  const px = (i: number) => [src8[i], src8[i + 1], src8[i + 2], src8[i + 3]];
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const opaque: number[] = [];
  for (let i = 0; i < src8.length; i += 4) if (src8[i + 3] > 160) opaque.push(i);
  // the field: the commonest colour among the logo's opaque pixels, roughly
  const buckets = new Map<string, { n: number; c: number[] }>();
  for (const i of opaque) {
    const k = [0, 1, 2].map((j) => Math.round(src8[i + j] / 32)).join();
    const b = buckets.get(k) ?? { n: 0, c: [0, 0, 0] };
    b.n++;
    for (let j = 0; j < 3; j++) b.c[j] += src8[i + j];
    buckets.set(k, b);
  }
  const commonest = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  const field = commonest ? commonest.c.map((v) => v / commonest.n) : [255, 255, 255];
  let fieldN = 0;
  for (const i of opaque) if (dist(px(i), field) < 48) fieldN++;
  const white = dist(field, [255, 255, 255]) < 40;
  // a tile, or a logo on a white card: the field is its ground; otherwise the logo is all glyph
  const ground = fieldN > SIZE * SIZE * 0.4;
  // the strongest colour that isn't the ground: the busiest saturated hue
  const bins = new Array(12).fill(0).map(() => ({ w: 0, r: 0, g: 0, b: 0 }));
  let darkN = 0;
  for (const i of opaque) {
    const p = px(i);
    if (ground && dist(p, field) < 48) continue;
    const mx = Math.max(p[0], p[1], p[2]), mn = Math.min(p[0], p[1], p[2]);
    const sat = mx ? (mx - mn) / mx : 0;
    if (sat < 0.25) {
      if (mx < 200) darkN++;
      continue;
    }
    const hue = (Math.atan2(Math.sqrt(3) * (p[1] - p[2]), 2 * p[0] - p[1] - p[2]) / (Math.PI * 2) + 1) % 1;
    const bin = bins[Math.floor(hue * 12) % 12];
    (bin.w += sat), (bin.r += p[0] * sat), (bin.g += p[1] * sat), (bin.b += p[2] * sat);
  }
  const top = bins.reduce((a, b) => (b.w > a.w ? b : a));
  const strongest = top.w > 8 ? [top.r / top.w, top.g / top.w, top.b / top.w] : darkN ? [34, 30, 44] : [42, 31, 94];
  let tone = ground && !white ? field : strongest;
  if (color) tone = [1, 3, 5].map((k) => parseInt(color.slice(k, k + 2), 16));
  // the glyph, in white: whatever is well clear of the ground's colour (so a
  // tile's gradient doesn't count), or, with no ground, the logo itself
  const out = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < src8.length; i += 4) {
    const p = px(i);
    const ink = ground ? (p[3] / 255) * Math.min(1, Math.max(0, (dist(p, field) - 85) / 45)) : p[3] / 255;
    out.data[i] = out.data[i + 1] = out.data[i + 2] = 255;
    out.data[i + 3] = Math.round(ink * 255);
  }
  g.putImageData(out, 0, 0);
  return { glyph: c, color: `#${tone.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}` };
}

/** The glyph in another colour, as a data URL, for drawing in SVG. */
export function glyphIn(b: Brand, color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const g = c.getContext("2d")!;
  g.drawImage(b.glyph, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, SIZE, SIZE);
  return c.toDataURL();
}
