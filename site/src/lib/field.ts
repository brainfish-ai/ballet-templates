// The hero's jigsaw: the Ballet mark as pieces of its own, in the middle of a
// field of tools that keeps on growing outward. The mark is its two parts,
// exactly as it's drawn: the square on its neck with the ball, and the bowl
// the ball sits in, the one joining the other. Round them, the tools are a
// jigsaw of their own, locking into each other, and the ones that meet the
// mark are cut to its outline, the way a puzzle is cut round a figure in its
// picture. There's no edge: the field runs on past the frame, and the pieces
// arrive in waves from the mark outward.
//
// Units: the mark's square is 1 across; the ball sits at 0,0; y runs up.
// Shared by the 3D hero and the flat board, so both cut it the same way.
import * as clipping from "polygon-clipping";
import type { MultiPolygon, Polygon } from "polygon-clipping";

type P = [number, number];

// the package ships a single default export, whatever its typings say
const { difference, intersection, union } = ((clipping as unknown as { default?: typeof clipping }).default ?? clipping) as typeof clipping;

/** The mark's own paths, in its 592-unit box (y down). */
const MARK = {
  square:
    "M109.393 125.899C109.393 115.678 117.678 107.393 127.899 107.393H229.682C239.903 107.393 248.188 115.678 248.188 125.899V227.682C248.188 237.903 239.903 246.188 229.682 246.188H127.899C117.678 246.188 109.393 237.903 109.393 227.682V125.899Z",
  neck: "M248.188 315.586C248.188 277.857 218.081 247.162 180.582 246.211L178.79 246.188L178.79 176.79L248.188 176.79C248.188 215.118 279.258 246.188 317.586 246.188V315.586H248.188Z",
  bowl: "M287.513 139.778H318.395C415.044 139.778 493.393 218.49 493.393 315.586C493.393 412.681 415.044 491.393 318.395 491.393H287.513V447.808C287.513 433.802 298.814 422.449 312.755 422.449H318.395C377.142 422.449 424.766 374.605 424.766 315.586C424.766 256.567 377.142 208.722 318.395 208.722H312.755C298.814 208.722 287.513 197.369 287.513 183.364V139.778Z",
};
/** The mark's square, and the ball's centre and radius, in its units. */
const U = 138.795;
const BALL = { x: 317.586, y: 315.586, r: 69.398 };

const cell = ([x, y]: P): P => [(x - BALL.x) / U, -(y - BALL.y) / U];

/** An absolute SVG path (M L H V C Z) as points. */
function flatten(d: string, steps = 10): P[] {
  const tok = d.match(/[MLHVCZ]|-?\d*\.?\d+/g) ?? [];
  const pts: P[] = [];
  let i = 0, cmd = "", x = 0, y = 0;
  const n = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[A-Z]/.test(tok[i])) cmd = tok[i++];
    if (cmd === "Z") continue;
    if (cmd === "M" || cmd === "L") (x = n()), (y = n()), pts.push([x, y]);
    else if (cmd === "H") (x = n()), pts.push([x, y]);
    else if (cmd === "V") (y = n()), pts.push([x, y]);
    else if (cmd === "C") {
      const [x1, y1, x2, y2, x3, y3] = [n(), n(), n(), n(), n(), n()];
      for (let k = 1; k <= steps; k++) {
        const t = k / steps, u = 1 - t;
        pts.push([
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        ]);
      }
      (x = x3), (y = y3);
    }
  }
  return pts;
}

const ring = (pts: P[]): Polygon => {
  const r = pts.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)] as P);
  return [[...r, r[0]]];
};
const circle = (cx: number, cy: number, r: number, n = 64): Polygon =>
  ring([...Array(n).keys()].map((i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)]));
const rect = (x0: number, y0: number, x1: number, y1: number): Polygon => ring([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
/** A short neck from `a` to `b`, `w` wide. */
const stem = (a: P, b: P, w: number): Polygon => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
  const nx = (-dy / l) * (w / 2), ny = (dx / l) * (w / 2);
  return ring([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]);
};

function area(r: P[]) {
  let s = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(s) / 2;
}
const areaOf = (m: MultiPolygon) => m.reduce((s, p) => s + area(p[0]) - p.slice(1).reduce((h, r) => h + area(r), 0), 0);

function inside([x, y]: P, r: P[]) {
  let hit = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
function edgeDistance([x, y]: P, rings: P[][]) {
  let d = Infinity;
  for (const r of rings)
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [ax, ay] = r[j], [bx, by] = r[i];
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)));
      d = Math.min(d, Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)));
    }
  return d;
}
/** The roomiest point inside a piece, and how much room it has: where its logo goes. */
function roomiest(poly: Polygon): { at: P; room: number } {
  const xs = poly[0].map((p) => p[0]), ys = poly[0].map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let best = { at: [(x0 + x1) / 2, (y0 + y1) / 2] as P, room: 0 };
  for (let i = 0; i <= 16; i++)
    for (let j = 0; j <= 16; j++) {
      const p: P = [x0 + ((x1 - x0) * i) / 16, y0 + ((y1 - y0) * j) / 16];
      if (!inside(p, poly[0]) || poly.slice(1).some((h) => inside(p, h))) continue;
      const room = edgeDistance(p, poly);
      if (room > best.room) best = { at: p, room };
    }
  return best;
}

/**
 * A ring with its needles taken off: points where it doubles back on itself
 * in a sliver, which a cut meeting a curve at a shallow angle can leave.
 */
function unspike(r: P[]): P[] {
  let pts = r;
  for (let pass = 0; pass < 3; pass++) {
    const next = pts.filter((p, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
      const u: P = [a[0] - p[0], a[1] - p[1]], v: P = [b[0] - p[0], b[1] - p[1]];
      const lu = Math.hypot(...u), lv = Math.hypot(...v);
      if (!lu || !lv) return false;
      const cos = (u[0] * v[0] + u[1] * v[1]) / (lu * lv);
      // a corner sharper than about 25 degrees, between two short sides
      return !(cos > 0.9 && Math.min(lu, lv) < 0.3);
    });
    if (next.length === pts.length) break;
    pts = next;
  }
  return pts;
}

/** A ring without its closing point. */
const open = (r: P[]) => (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r.slice(0, -1) : r);
/** Fewer points along a ring, none further than `tol` from where it was. */
function simplify(pts: P[], tol = 0.004): P[] {
  if (pts.length < 4) return pts;
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let worst = -1, at = -1;
    for (let i = a + 1; i < b; i++) {
      const d = edgeDistance(pts[i], [[pts[a], pts[b]]]);
      if (d > worst) (worst = d), (at = i);
    }
    if (worst > tol) (keep[at] = true), stack.push([a, at], [at, b]);
  }
  return pts.filter((_, i) => keep[i]);
}
/**
 * The outline `d` clear of a shape all round, found along rays out from `o`
 * inside it: smooth, and rounded where the shape has corners.
 */
function around(m: MultiPolygon, o: P, d: number, n = 220): MultiPolygon {
  const rings = m.map((p) => p[0] as P[]);
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2, u: P = [Math.cos(th), Math.sin(th)];
    const at = (t: number): P => [o[0] + u[0] * t, o[1] + u[1] * t];
    // from where the ray leaves the shape, out until it's d clear, then home in
    let lo = Math.max(0, ...crossings(m, o, u)), hi = lo + d;
    while (edgeDistance(at(hi), rings) < d) hi += 0.1;
    for (let k = 0; k < 20; k++) {
      const t = (lo + hi) / 2;
      if (edgeDistance(at(t), rings) < d) lo = t;
      else hi = t;
    }
    pts.push(at(hi));
  }
  return [ring(simplify(pts))];
}
/** Where a ray from `o` along `u` crosses a shape's outlines, as distances along it. */
function crossings(m: MultiPolygon, o: P, u: P): number[] {
  const hits: number[] = [];
  for (const poly of m)
    for (const r of poly) {
      for (let i = 0; i < r.length - 1; i++) {
        const [ax, ay] = r[i], [bx, by] = r[i + 1];
        const ex = bx - ax, ey = by - ay;
        const den = u[0] * ey - u[1] * ex;
        if (Math.abs(den) < 1e-12) continue;
        const t = ((ax - o[0]) * ey - (ay - o[1]) * ex) / den;
        const s = ((ax - o[0]) * u[1] - (ay - o[1]) * u[0]) / den;
        if (t > 0 && s >= 0 && s <= 1) hits.push(t);
      }
    }
  return hits.sort((a, b) => a - b);
}
function centroid(r: P[]): P {
  let a = 0, x = 0, y = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    (a += f), (x += (r[j][0] + r[i][0]) * f), (y += (r[j][1] + r[i][1]) * f);
  }
  return [x / (3 * a), y / (3 * a)];
}
/**
 * The field's pieces are this many of the mark's squares across: big enough
 * that every joint can be one of the mark's own shapes, at its own size.
 */
const CELL = 1.8;

/**
 * Every joint in the puzzle is one of the mark's own shapes, at the mark's
 * own size, on a short neck whose fillets curve the way the mark's neck does:
 * its ball, its square, or its bowl, a C whose hollow the next piece fills,
 * the way the ball fills the mark's. In the mark's units (its square is 1
 * across, and so is its ball).
 */
export type JointKind = "ball" | "square" | "bowl";
const JOINT_KINDS: JointKind[] = ["ball", "square", "bowl", "ball", "square"];
/** Each kind's outline across an edge: s along it from the joint's middle, d out of the piece, from one foot of the neck to the other. */
const JOINTS: Record<JointKind, P[]> = (() => {
  const neck = 0.26, fillet = 0.16, foot = neck + fillet;
  const arc = (cx: number, cy: number, r: number, from: number, to: number, n: number): P[] =>
    [...Array(n + 1).keys()].map((i) => [cx + r * Math.cos(from + ((to - from) * i) / n), cy + r * Math.sin(from + ((to - from) * i) / n)]);
  // the neck, up to `top`: its sides curving in from a wide foot, as the mark's neck does
  const stalk = (top: number) =>
    ring([
      ...arc(-foot, fillet, fillet, -Math.PI / 2, 0, 8),
      [-neck, top],
      [neck, top],
      ...arc(foot, fillet, fillet, Math.PI, Math.PI * 1.5, 8),
      [foot + 0.3, 0],
      [foot + 0.3, -0.4],
      [-foot - 0.3, -0.4],
      [-foot - 0.3, 0],
    ]);
  const rounded = (at: number, h: number, rc: number): Polygon =>
    ring([
      ...arc(h - rc, at - h + rc, rc, -Math.PI / 2, 0, 6),
      ...arc(h - rc, at + h - rc, rc, 0, Math.PI / 2, 6),
      ...arc(-h + rc, at + h - rc, rc, Math.PI / 2, Math.PI, 6),
      ...arc(-h + rc, at - h + rc, rc, Math.PI, Math.PI * 1.5, 6),
    ]);
  // each head, and how far up into it its neck runs: into the middle of the
  // ball and the square, but only into the foot of the bowl, whose hollow is
  // the next piece's, reached through its mouth, turned away from the piece
  const B = 0.74;
  const heads: Record<JointKind, [MultiPolygon, number]> = {
    ball: [[circle(0, 0.62, 0.5, 72)], 0.62],
    square: [[rounded(0.62, 0.46, 0.12)], 0.62],
    bowl: [difference(circle(0, B, 0.58, 72), circle(0, B, 0.3, 48), ring([[0, B], ...arc(0, B, 1, Math.PI / 2 - 0.8, Math.PI / 2 + 0.8, 8)])), B - 0.42],
  };
  const out = {} as Record<JointKind, P[]>;
  for (const kind of Object.keys(heads) as JointKind[]) {
    const [head, top] = heads[kind];
    const r = open(union(stalk(top), head)[0][0] as P[]);
    // the outline from one foot of the neck round the head to the other, leaving out the base strip
    const near = (p: P) => r.reduce((b, q, i) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(r[b][0] - p[0], r[b][1] - p[1]) ? i : b), 0);
    const iL = near([-foot, 0]), iR = near([foot, 0]);
    const path: P[] = [];
    // the outer ring runs anticlockwise, so up from the right foot, over the head, down to the left
    for (let i = iR; ; i = (i + 1) % r.length) {
      path.push(r[i]);
      if (i === iL) break;
    }
    out[kind] = path.reverse();
  }
  return out;
})();
const kindOf = (seed: number): JointKind => {
  const x = Math.sin(seed * 45.164 + 7.3) * 43758.5453;
  return JOINT_KINDS[Math.floor((x - Math.floor(x)) * JOINT_KINDS.length)];
};

/** A joint at `at`, its head swelling out along `u`; it dips a little behind its foot, to overlap where it comes from. */
function knob(at: P, u: P, kind: JointKind): MultiPolygon {
  const t: P = [-u[1], u[0]];
  const profile = JOINTS[kind];
  const foot = Math.abs(profile[0][0]);
  const pts: P[] = [[-foot - 0.02, -0.06], ...profile, [foot + 0.02, -0.06]];
  return [ring(pts.map(([s, d]) => [at[0] + t[0] * s + u[0] * d, at[1] + t[1] * s + u[1] * d]))];
}

export interface FieldPiece {
  kind: "mark" | "tool";
  /** For the mark's pieces: which one. */
  part?: "body" | "bowl";
  /** Where the piece sits; its outline is drawn round this point. */
  x: number;
  y: number;
  /** Outer ring first, then any holes, round (x, y). */
  rings: P[][];
  /** Where its logo goes, round (x, y), and how wide the logo can be; none if there's no room. */
  face?: { x: number; y: number; size: number };
  /** How far out from the mark it is, for the order the pieces arrive in. */
  reach: number;
  /** For a tool in one of the rings round the mark: which (0 is the inner). */
  band?: number;
}

/**
 * Cuts the field: the mark's two pieces, a ring of tools fitted round them,
 * then a tool in every cell of cols × rows (counted out from the ball, CELL
 * apart) beyond the ring that `keep` wants (by default, all of them), given
 * where the cell's middle would be.
 */
export function field(cols: [number, number], rows: [number, number], keep: (x: number, y: number) => boolean = () => true): FieldPiece[] {
  const square = ring(flatten(MARK.square).map(cell));
  const neck = ring(flatten(MARK.neck).map(cell));
  const ball = circle(0, 0, BALL.r / U);
  // the mark's two pieces: the square on its neck with the ball, as it's drawn,
  // and the bowl, grown in to meet it, the ball's socket: the gap the mark
  // leaves round the ball, and beside the square, is the bowl's, so the two
  // fit the way a jigsaw's knob fits its socket, with nothing between them
  const body = union(square, neck, ball);
  const side = (248.188 - BALL.x) / U, armEnd = (287.513 - BALL.x) / U, armTop = (BALL.y - 139.778) / U;
  const socket = union(
    rect(side - 0.02, 0.5, 0, armTop),
    rect(armEnd, -armTop, 0, 0.5),
    intersection(circle(0, 0, 0.9, 96), rect(-0.01, -1, 1, 1)),
  );
  const bowl = difference(union(ring(flatten(MARK.bowl).map(cell)), socket), body).sort((a, b) => area(b[0]) - area(a[0]))[0];
  const figure = union(body, bowl);

  const key = (c: number, r: number) => `${c},${r}`;
  const rand = (a: number, b: number, k: number) => {
    const x = Math.sin(a * 127.1 + b * 311.7 + k * 74.7 + 9.2) * 43758.5453;
    return x - Math.floor(x);
  };
  /** Corner (i, j) of the grid, nudged out of true: cell (c, r) has corners c to c + 1 across and r to r + 1 up. */
  const corner = (i: number, j: number): P => [
    (i - 0.5 + (rand(i, j, 1) - 0.5) * 0.2) * CELL,
    (j - 0.5 + (rand(i, j, 2) - 0.5) * 0.2) * CELL,
  ];
  /** An edge from a to b, a gentle curve; `tab` puts a joint on it, its ball to the edge's left (+1) or right (-1). */
  function curve(a: P, b: P, tab: number, seed: number): P[] {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const r = (k: number) => (rand(seed, k, 3) - 0.5) * 2;
    const pts: P[] = [a];
    if (!tab) {
      const at = (l: number, w: number): P => [a[0] + dx * l - dy * w, a[1] + dy * l + dx * w];
      const [p1, p2] = [at(0.33, r(1) * 0.035), at(0.66, r(5) * 0.035)];
      for (let k = 1; k <= 10; k++) {
        const s = k / 10, u = 1 - s;
        pts.push([
          u * u * u * a[0] + 3 * u * u * s * p1[0] + 3 * u * s * s * p2[0] + s * s * s * b[0],
          u * u * u * a[1] + 3 * u * u * s * p1[1] + 3 * u * s * s * p2[1] + s * s * s * b[1],
        ]);
      }
      return pts;
    }
    // the joint: one of the mark's shapes on its neck, full size, near the edge's middle
    const len = Math.hypot(dx, dy);
    const u: P = [dx / len, dy / len], n: P = [-u[1] * tab, u[0] * tab];
    const m: P = [a[0] + dx * (0.5 + r(2) * 0.04), a[1] + dy * (0.5 + r(2) * 0.04)];
    for (const [js, jd] of JOINTS[kindOf(seed)]) pts.push([m[0] + u[0] * js + n[0] * jd, m[1] + u[1] * js + n[1] * jd]);
    pts.push(b);
    return pts;
  }

  // round the mark, a ring of tools fitted flush against it, following its
  // outline outward the way the bowl follows the ball; one of them fills the
  // pocket under its neck, the mark's own socket. The ring is cut into pieces
  // by cuts out from the mark's middle, placed by hand so none runs through
  // that pocket, a joint on every cut, each piece taking its neighbour's ball
  // and passing its own on, round the ring
  const mid = centroid(figure[0][0] as P[]);
  const out = around(figure, mid, 1.75);
  const CUTS = [30, 75, 125, 172, 258, 302, 346];
  const toward = (deg: number): P => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
  const along = (u: P, t: number): P => [mid[0] + u[0] * t, mid[1] + u[1] * t];
  const spans = (u: P) => {
    const rin = Math.max(...crossings(figure, mid, u));
    return [rin, crossings(out, mid, u).find((t) => t > rin + 0.1) ?? rin + 1.75];
  };
  const cut = (k: number): P[] => {
    const u = toward(CUTS[k % CUTS.length] + (k >= CUTS.length ? 360 : 0));
    const [rin, rout] = spans(u);
    return [mid, ...curve(along(u, rin - 0.02), along(u, rout + 0.02), 1, k % CUTS.length), along(u, 14)];
  };
  const region = difference(out, figure);
  const cuts = [...Array(CUTS.length + 1).keys()].map(cut);
  const ringTools: { poly: Polygon }[] = [];
  const ringScraps: Polygon[] = [];
  const ringKnobs: MultiPolygon[] = [];
  for (let k = 0; k < CUTS.length; k++) {
    const a0 = CUTS[k], a1 = k + 1 < CUTS.length ? CUTS[k + 1] : CUTS[0] + 360;
    const arc = [...Array(9).keys()].map((i) => along(toward(a0 + ((a1 - a0) * i) / 8), 14));
    const wedge = ring([...cuts[k], ...arc, ...[...cuts[k + 1]].reverse().slice(0, -1)]);
    const parts = intersection(region, wedge).sort((p, q) => area(q[0]) - area(p[0]));
    if (!parts.length) continue;
    let poly: Polygon = parts[0];
    for (const extra of parts.slice(1)) {
      const u2 = union(poly, extra);
      if (u2.length === 1) poly = u2[0];
      else ringScraps.push(extra);
    }
    // and a joint out into the field, from the piece's middle; it only counts if its ball joins the piece
    const u = toward((a0 + a1) / 2);
    const outward = knob(along(u, spans(u)[1]), u, kindOf(k * 31 + 5));
    const withOut = union(poly, outward);
    if (withOut.length === 1) (poly = withOut[0]), ringKnobs.push(outward);
    ringTools.push({ poly });
  }
  for (const scrap of ringScraps) {
    const host = ringTools.find((t) => union(t.poly, scrap).length === 1);
    if (host) host.poly = union(host.poly, scrap)[0];
  }
  // everything inside the ring, and its joints out into the field
  const block = union(out, ...ringKnobs);

  // the field: a grid nudged out of true, so no two pieces are alike; every
  // cell beyond the ring that the camera can see
  const centre = (c: number, r: number): P => [c * CELL, r * CELL];
  const box = (c: number, r: number) => rect((c - 0.5) * CELL, (r - 0.5) * CELL, (c + 0.5) * CELL, (r + 0.5) * CELL);
  // the cell as its nudged corners have it, which can reach out past the ring where its square doesn't
  const quad = (c: number, r: number) => ring([corner(c, r), corner(c + 1, r), corner(c + 1, r + 1), corner(c, r + 1)]);
  const cells = new Set<string>();
  for (let r = rows[0]; r <= rows[1]; r++)
    for (let c = cols[0]; c <= cols[1]; c++)
      if (keep(...centre(c, r)) && areaOf(difference(quad(c, r), block)) >= 0.002) cells.add(key(c, r));
  // each tool hangs off the one beside it nearer the mark by a single joint,
  // its ball in this tool's socket, so every tool joins back to Ballet; the
  // first ones out hang off the ring's own joints instead
  const rim = (block[0][0] as P[]).concat(...block.slice(1).map((p) => p[0] as P[]));
  const reachOf = new Map<string, number>();
  for (const k of cells) {
    const [c, r] = k.split(",").map(Number);
    reachOf.set(k, edgeDistance(centre(c, r), [rim]));
  }
  const parent = new Map<string, string>();
  for (const k of cells) {
    const [c, r] = k.split(",").map(Number);
    if (ringKnobs.some((kn) => intersection(box(c, r), kn).length)) continue;
    const own = reachOf.get(k)!;
    const nearer = [key(c + 1, r), key(c - 1, r), key(c, r + 1), key(c, r - 1)]
      .filter((n) => cells.has(n) && reachOf.get(n)! < own - 0.05)
      .sort((x, y) => reachOf.get(x)! - reachOf.get(y)!)[0];
    if (nearer) parent.set(k, nearer);
  }
  // every edge, once, shared by the two pieces either side of it: "h" runs along
  // the bottom of cell (c, r), left to right; "v" up its left side
  const edgeCache = new Map<string, P[]>();
  const edge = (c: number, r: number, d: "h" | "v"): P[] => {
    const id = `${c},${r},${d}`;
    if (edgeCache.has(id)) return edgeCache.get(id)!;
    const a = corner(c, r);
    const b = d === "h" ? corner(c + 1, r) : corner(c, r + 1);
    // the cells either side: to the left of the edge's direction, then to its right
    const [lk, rk] = d === "h" ? [key(c, r), key(c, r - 1)] : [key(c - 1, r), key(c, r)];
    const seed = c * 131 + r * 17 + (d === "h" ? 7 : 3);
    let pts = curve(a, b, 0, seed);
    // a joint only where one of the two hangs off the other, its ball swelling
    // into the one that hangs, if it's clear of the ring
    const tab = parent.get(lk) === rk ? 1 : parent.get(rk) === lk ? -1 : 0;
    if (tab) {
      const tried = curve(a, b, tab, seed);
      if (!intersection(ring(tried), block).length) pts = tried;
    }
    edgeCache.set(id, pts);
    return pts;
  };
  const cellShape = (c: number, r: number): Polygon => {
    const bottom = edge(c, r, "h"), right = edge(c + 1, r, "v"), top = edge(c, r + 1, "h"), left = edge(c, r, "v");
    return ring([...bottom.slice(0, -1), ...right.slice(0, -1), ...[...top].reverse().slice(0, -1), ...[...left].reverse().slice(0, -1)]);
  };

  const pieces: FieldPiece[] = [];
  const mark = (part: FieldPiece["part"], m: MultiPolygon) => {
    const poly = m.sort((a, b) => area(b[0]) - area(a[0]))[0];
    pieces.push({ kind: "mark", part, x: 0, y: 0, rings: (poly as P[][]).map(open), reach: 0 });
  };
  mark("body", body);
  mark("bowl", [bowl]);

  // the field's tools: each cell cut by its edges, and by the ring where they meet
  type Tool = { x: number; y: number; c: number; r: number; poly: Polygon };
  const tools: Tool[] = [];
  const byCell = new Map<string, Tool>();
  const scraps: Tool[] = [];
  for (let r = rows[0]; r <= rows[1]; r++)
    for (let c = cols[0]; c <= cols[1]; c++) {
      if (!cells.has(key(c, r))) continue;
      const shape = cellShape(c, r);
      const cut = intersection(shape, block).length ? difference(shape, block) : [shape];
      if (!cut.length) continue;
      const [main, ...offcuts] = cut.sort((a, b) => area(b[0]) - area(a[0]));
      const [x, y] = centre(c, r);
      const t: Tool = { x, y, c, r, poly: main };
      tools.push(t);
      byCell.set(key(c, r), t);
      for (const o of offcuts) if (area(o[0]) > 1e-5) scraps.push({ x, y, c, r, poly: o });
    }
  const neighbours = (t: Tool) =>
    [key(t.c, t.r), key(t.c + 1, t.r), key(t.c - 1, t.r), key(t.c, t.r + 1), key(t.c, t.r - 1)]
      .map((k) => byCell.get(k))
      .filter((o): o is Tool => !!o && o !== t);
  // an offcut, or a piece too small to hold a logo, joins whichever piece round
  // it it touches (a ring piece if need be), or is let go
  const absorb = (t: Tool) => {
    const host = neighbours(t).find((o) => union(o.poly, t.poly).length === 1);
    if (host) return void (host.poly = union(host.poly, t.poly)[0]);
    const ringHost = ringTools.find((o) => union(o.poly, t.poly).length === 1);
    if (ringHost) ringHost.poly = union(ringHost.poly, t.poly)[0];
  };
  for (const o of scraps) absorb(o);
  for (const t of [...tools].sort((a, b) => area(a.poly[0]) - area(b.poly[0]))) {
    if (area(t.poly[0]) > 0.3 * CELL * CELL) continue;
    tools.splice(tools.indexOf(t), 1);
    byCell.delete(key(t.c, t.r));
    absorb(t);
  }

  const outlinePts = (figure[0][0] as P[]).concat(...figure.slice(1).map((p) => p[0] as P[]));
  const tool = (poly: Polygon, x: number, y: number, band?: number) => {
    const rings = (poly as P[][]).map((rg) => unspike(open(rg)).map(([px, py]) => [px - x, py - y] as P));
    const { at, room } = roomiest(rings);
    pieces.push({
      kind: "tool",
      x,
      y,
      rings,
      // as big a logo as the piece has room for; a piece too pinched for a good-sized one goes without
      face: room >= 0.3 ? { x: at[0], y: at[1], size: Math.min(1.1, room * 1.6) } : undefined,
      reach: edgeDistance([x, y], [outlinePts]),
      band,
    });
  };
  // the ring's pieces, each placed at its own middle
  for (const t of ringTools) {
    const [cx, cy] = centroid(open(t.poly[0] as P[]));
    tool(t.poly, cx, cy, 0);
  }
  for (const t of tools) tool(t.poly, t.x, t.y);
  return pieces;
}

/**
 * Which of `count` logos a tool carries, given its rank by reach: the nearest
 * dozen get the first dozen in turn, so the best-known sit by the mark, and
 * the rest are spread by position, so no two neighbours carry the same one.
 */
export function logoSlot(p: FieldPiece, rank: number, count: number) {
  const near = Math.min(12, count);
  if (rank < near || count <= near) return rank % count;
  const rest = count - near;
  // by the piece's cell, stepping 3 across and 5 up, so no two side by side share one
  const i = Math.round(p.x / CELL) * 3 + Math.round(p.y / CELL) * 5;
  return near + (((i % rest) + rest) % rest);
}

/** A piece's rings as one SVG path, scaled, y turned down. */
export function fieldPath(rings: P[][], scale = 100) {
  return rings
    .map((r) => r.map(([x, y], i) => `${i ? "L" : "M"}${+(x * scale).toFixed(2)} ${+(-y * scale).toFixed(2)}`).join("") + "Z")
    .join("");
}

export { areaOf };
